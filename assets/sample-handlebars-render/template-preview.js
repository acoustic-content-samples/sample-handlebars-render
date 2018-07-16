/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License Na
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */
"use strict";

const contentModeContent = 'content';
const contentModeSearch = 'list';
const templateLocationLocal = 'local';
const templateLocationRemote = 'remote';

// The current selection
var selectedContent = {
    templateLocation: templateLocationLocal,
    contentMode: "content",
    template: "#default",
    contentType: "",
    contentId: '',
    searchTags: '',
    numSearchRows: "3"
};

const baseTenantUrl = "{Tenant API URL}";
const noResultsMessage = 'Your selection will appear here';

var wchRenderer;
function initRenderer() {
    var baseTenantUrlOverride = selectedContent.templateLocation == templateLocationLocal ? '.' : null;

    wchRenderer = new WCHRenderer({
        // The following line is for using local templates with Express server. Remove it to use hosted remote templates
        baseTemplateUrl: baseTenantUrlOverride,   
        baseTenantURL: baseTenantUrl
    });

}

document.addEventListener("DOMContentLoaded", (function() {
    document.getElementById("templateLocationLocalButton").checked = true;
    updateFieldVisibility()
}));

function updateFieldVisibility() {
    selectedContent.contentMode = document.getElementById('contentModeSearchButton').checked ? contentModeSearch : contentModeContent;
    selectedContent.templateLocation = document.getElementById('templateLocationLocalButton').checked ? templateLocationLocal : templateLocationRemote;
    initRenderer();
    initTypeSelector();
    handleTypeSelectChange();
    if (selectedContent.contentMode == contentModeContent) {
        document.getElementById('rowsInputContainer').style.display = 'none';
        document.getElementById('tagsInputContainer').style.display = 'none';
        document.getElementById('contentItemSelectorContainer').style.display = 'block';
        document.getElementById("contentModeContentButton").checked = true;
    }
    else {
        document.getElementById('rowsInputContainer').style.display = 'block';
        document.getElementById('tagsInputContainer').style.display = 'block';
        document.getElementById('contentItemSelectorContainer').style.display = 'none';
        document.getElementById("contentModeSearchButton").checked = true;
    }

}

function renderSelectedContent() {
    var selContent = selectedContent;
    selContent.contentMode = document.getElementById('contentModeContentButton').checked ? contentModeContent : contentModeSearch;
    selContent.template = templateSelector.value;
    selContent.contentType = contentTypeSelector.value;
    if (contentItemSelector.options[contentItemSelector.selectedIndex]) {
        selContent.contentId = contentItemSelector.options[contentItemSelector.selectedIndex].value;
    }
    else {
        selContent.contentId = '';
    }
    selContent.searchTags = searchTagsInput.value;
    selContent.numSearchRows = rowsInput.value;

    renderContent(selContent, "result");
}
// Render content item or search results at specified location ID
function renderContent(selContent, renderLocationId) {
    if (selContent.contentMode == contentModeContent) {
        if (selContent.contentId && selContent.template) {
            wchRenderer.renderItem(selContent.contentId, selContent.template, renderLocationId);

        }
    }
    else if (selContent.contentMode == contentModeSearch) {
        //search display
        var searchParams = "fq=type:" + selContent.contentType + "&sort=lastModified%20desc&rows=" + selContent.numSearchRows;
        // See if search tags specified
        var tags = [];
        var tagsString = selContent.searchTags;
        if (tagsString) {
            tags = tagsString.split(',');
        }
        // console.log('tags: ', JSON.stringify(tags, null, 4));
        if (tags.length > 0) {
            searchParams = searchParams + "&fq=tags:(" + tags.join(' OR ') + ')';
        }
        wchRenderer.renderSearch(searchParams, selContent.template, renderLocationId);
    }
    else {
        // do nothing
    }
}

var templateFolder = "/sample-handlebars-render/hbs-templates";
var defaultTemplateName = "default.hbs";

var availableTemplates = [];

// Get complete list of availableTemplates
function getTemplateList() {
    const searchParams = "q=*:*&fl=*&fq=classification:asset&fq=location:*" + templateFolder + "*&rows=200";
    return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = resolve;
            req.onerror = function(err) {
                reject("Network Error");
            };
            const url = baseTenantUrl + '/delivery/v1/search?' + searchParams;
            req.open("GET", url);
            req.send();
        }).
        // extract the XHR from the event
    then(event => event.target).
        // extract the response body from the xhr request
    then(req => req.responseText).
        // parse the JSON
    then(JSON.parse).
    then(result => {
        var documents = result.documents;
        // console.log("Delivery search response: " + JSON.stringify(documents, null, 4));
        availableTemplates = [];
        for (var i = 0; i < documents.length; i++) {
            if (availableTemplates.indexOf(documents[i].path) < 0) {
                availableTemplates.push(documents[i].path);
            }
        }
        // console.log('remote templates: ', availableTemplates);
    });
}

// Get list of templates from local file system
function getLocalTemplateList() {
    return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = resolve;
            req.onerror = function(err) {
                reject("Network Error");
            };
            var url = './api/getTemplateList';
            req.open("GET", url);
            req.send();
        }).
        // extract the XHR from the event
    then(event => event.target).
        // extract the response body from the xhr request
    then(req => req.responseText).
        // parse the JSON
    then(JSON.parse).
    then(result => {
        availableTemplates = result;
        // console.log('local templates: ', availableTemplates);
    });
}

// Populate template drop-down based on content type and whether content/list
function populateTemplatePicker(contentType, contentOrList) {
    var filter = templateFolder + "/" + contentOrList + "/" + contentType + "/";
    // var options = '<option value="#default">Default</option>';
    var options = '<option value="">[Select template]</option><option value="#default">Default</option>';
    for (var i = 0; i < availableTemplates.length; i++) {
        var template = availableTemplates[i];
        if (template.startsWith(filter)) {
            var shortName = template.replace(filter, "");
            if (shortName != defaultTemplateName) {
                options = options + '<option value="' + template + '">' + shortName + '</option>';
            }
        }
    }
    var targetNode = document.getElementById('templateSelector');
    targetNode.innerHTML = options;
    var resultNode = document.getElementById('result');
    resultNode.innerHTML = noResultsMessage;
}

// Populate the content item drop-down
function populateContentPicker() {
    if (!selectedContent.contentType) {
        return;
    }

    var searchParams = "q=*:*&fl=*&fq=classification:content&fq=type:" + selectedContent.contentType + "&rows=200";
    searchParams = searchParams.replace(' ', '%5C ');

    return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = resolve;
            req.onerror = function(err) {
                reject("Network Error");
            };
            const url = baseTenantUrl + '/delivery/v1/search?' + searchParams;
            req.open("GET", url);
            req.send();
        }).
        // extract the XHR from the event
    then(event => event.target).
        // extract the response body from the xhr request
    then(req => req.responseText).
        // parse the JSON
    then(JSON.parse).
    then(result => {
        var documents = result.documents;
        // console.log("Delivery search response: " + JSON.stringify(documents, null, 4));
        var options = '';
        for (var i = 0; i < documents.length; i++) {
            var itemName = documents[i].name;
            var itemId = documents[i].id.replace("content:", "");
            options = options + '<option value="' + itemId + '">' + itemName + '</option>';
        }
        var targetNode = document.getElementById('contentItemSelector');
        targetNode.innerHTML = options;
        // set current value
        if (selectedContent.contentId) {
            targetNode.value = selectedContent.contentId;
        }
    });
}

var availableListTypes = [];


function initTypeSelector() {
    if (selectedContent.templateLocation == templateLocationLocal) {
        // get list of templates from file system
        getLocalTemplateList().
        then(result => {
            populatePickers();
        });
    }
    else {
        // get list of templates from WCH server
        getTemplateList().
        then(result => {
            populatePickers();
        });

    }
}

function populatePickers() {
    // console.log('results: ', availableTemplates);
    availableListTypes = [];
    var options = '<option value="">[Select type]</option>';
    var filter = templateFolder + "/" + selectedContent.contentMode + "/";
    for (var i = 0; i < availableTemplates.length; i++) {
        var template = availableTemplates[i];
        if (template.startsWith(filter)) {
            var remainingPath = template.replace(filter, "");
            var idx = remainingPath.indexOf('/');
            var typeName = remainingPath.substring(0, idx);
            if (availableListTypes.indexOf(typeName) < 0) {
                availableListTypes.push(typeName);
                options = options + '<option value="' + typeName + '">' + typeName + '</option>';

            }
        }
    }
    var targetNode = document.getElementById('contentTypeSelector');
    targetNode.innerHTML = options;
    targetNode.value = selectedContent.contentType;
    handleTypeSelectChange();
}

function handleTypeSelectChange() {
    var listOrContent = selectedContent.contentMode == contentModeContent ? "content" : "list";
    var contentType = contentTypeSelector.value;
    if (contentType) {
        selectedContent.contentType = contentType;
        populateTemplatePicker(selectedContent.contentType, listOrContent);
    }
    populateContentPicker();

}


var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function(s) {
        return entityMap[s];
    });
}