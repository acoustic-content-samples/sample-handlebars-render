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

var contentModeContent = 'content';
var contentModeSearch = 'list';

var __SPNS__spInstance = null;
if (typeof __SPNS__spHelper !== 'undefined') {
    __SPNS__spInstance = __SPNS__spHelper;
}

// Save native promise - restore it after making call to preferences API, which sets Promise
var nativePromise;
if (typeof nativePromise == 'undefined') {
    nativePromise = Promise;
}

// The current selection
var __SPNS__selectedContent = {
    contentMode: "",
    template: "#default",
    contentType: "",
    contentId: '',
    searchTags: '',
    numSearchRows: "3"
};


document.addEventListener("DOMContentLoaded", (function() {
    if (!editMode) {
        __SPNS__renderContentUsingPrefs();
    }
    $(__SPNS__wchContentResult).click(function(e) {
    if (e.shiftKey) {
        $("#__SPNS__preferences-modal").modal();
        __SPNS__initDialog();
    } 
});
}));

function __SPNS__initDialog() {
    __SPNS__spInstance.getPortletPreferences().then(
        function(prefs) {
            if (nativePromise) {
                Promise = nativePromise;
            }
            if (prefs) {
                __SPNS__selectedContent = prefs;

            }
            var selContent = __SPNS__selectedContent;
            // update form
            __SPNS__contentModeContentButton.checked = selContent.contentMode == contentModeContent;
            __SPNS__contentModeSearchButton.checked = selContent.contentMode != contentModeContent;
            __SPNS__templateSelector.value = selContent.template;
            __SPNS__contentTypeSelector.value = selContent.contentType;
            __SPNS__contentItemSelector.value = selContent.contentId;
            __SPNS__searchTagsInput.value = selContent.searchTags;
            __SPNS__rowsInput.value = selContent.numSearchRows;
            __SPNS__updateFieldVisibility();
        });

}

function __SPNS__updateFieldVisibility() {
    __SPNS__selectedContent.contentMode = document.getElementById('__SPNS__contentModeContentButton').checked ? contentModeContent : contentModeSearch;
    __SPNS__initTypeSelector();
    __SPNS__handleTypeSelectChange();
    if (__SPNS__selectedContent.contentMode == contentModeContent) {
        document.getElementById('__SPNS__rowsInputContainer').style.display = 'none';
        document.getElementById('__SPNS__tagsInputContainer').style.display = 'none';
        document.getElementById('__SPNS__contentItemSelectorContainer').style.display = 'block';
        document.getElementById("__SPNS__contentModeContentButton").checked = true;
    }
    else {
        document.getElementById('__SPNS__rowsInputContainer').style.display = 'block';
        document.getElementById('__SPNS__tagsInputContainer').style.display = 'block';
        document.getElementById('__SPNS__contentItemSelectorContainer').style.display = 'none';
        document.getElementById("__SPNS__contentModeSearchButton").checked = true;
    }

}

function __SPNS__updateSettingsFromPreferences() {

}

// retrieve preferences and render content based on selections
function __SPNS__renderContentUsingPrefs() {
    __SPNS__spInstance.getPortletPreferences().then(
        function(prefs) {
            if (nativePromise) {
                Promise = nativePromise;
            }
            if (prefs) {
                __SPNS__selectedContent = prefs;

            }
            var selContent = __SPNS__selectedContent;
            __SPNS__renderContent(selContent, "__SPNS__wchContentResult");
        });
}

// Render content item or search results at specified location ID
function __SPNS__renderContent(selContent, renderLocationId) {
    if (selContent.contentMode == contentModeContent) {
        wchRenderer.renderItem(selContent.contentId, selContent.template, "__SPNS__wchContentResult");
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
        wchRenderer.renderSearch(searchParams, selContent.template, '__SPNS__wchContentResult');
    }
    else {
        // do nothing
    }
}

// Save preferences and close dialog
function __SPNS__saveAndClose() {
    var selContent = __SPNS__selectedContent;
    selContent.contentMode = document.getElementById('__SPNS__contentModeContentButton').checked ? contentModeContent : contentModeSearch;
    selContent.template = __SPNS__templateSelector.value;
    selContent.contentType = __SPNS__contentTypeSelector.value;
    if (__SPNS__contentItemSelector.options[__SPNS__contentItemSelector.selectedIndex]) {
        selContent.contentId = __SPNS__contentItemSelector.options[__SPNS__contentItemSelector.selectedIndex].value;
    }
    selContent.searchTags = __SPNS__searchTagsInput.value;
    selContent.numSearchRows = __SPNS__rowsInput.value;

    __SPNS__spInstance.setPortletPreferences(__SPNS__selectedContent).then(function(result) {
        if (nativePromise) {
            Promise = nativePromise;
        }
        __SPNS__renderContent(selContent, "__SPNS__wchContentResult");

        // $('#__SPNS__prefDialog').dialog('close');
        // window.top.location.reload();
    }, function(error) {
        // here you would handle error conditions from getting the
        // preference
        // in this case I ignore the error 0001 which I get when not running
        // within a portal context
        if (error.message.toString().indexOf("ERR0001:") != 0)
            alert(error.name + "\n" + error.message);
    });
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

    });
}

// Populate template drop-down based on content type and whether content/list
function __SPNS__populateTemplatePicker(contentType, contentOrList) {
    var filter = templateFolder + "/" + contentOrList + "/" + contentType + "/";
    var options = '<option value="#default">Default</option>';
    for (var i = 0; i < availableTemplates.length; i++) {
        var template = availableTemplates[i];
        if (template.startsWith(filter)) {
            var shortName = template.replace(filter, "");
            if (shortName != defaultTemplateName) {
                options = options + '<option value="' + template + '">' + shortName + '</option>';
            }
        }
    }
    var targetNode = document.getElementById('__SPNS__templateSelector');
    targetNode.innerHTML = options;
}

// Populate the content item drop-down
function __SPNS__populateContentPicker() {
    var searchParams = "q=*:*&fl=*&fq=classification:content&fq=type:" + __SPNS__selectedContent.contentType + "&rows=200";
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
        var targetNode = document.getElementById('__SPNS__contentItemSelector');
        targetNode.innerHTML = options;
        // set current value
        if (__SPNS__selectedContent.contentId) {
            targetNode.value = __SPNS__selectedContent.contentId;
        }
    });
}

var availableListTypes = [];

function __SPNS__initTypeSelector() {
    getTemplateList().
    then(searchResults => {
        // console.log('results: ', availableTemplates);
        availableListTypes = [];
        var options = '';
        var filter = templateFolder + "/" + __SPNS__selectedContent.contentMode + "/";
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
        var targetNode = document.getElementById('__SPNS__contentTypeSelector');
        targetNode.innerHTML = options;
        targetNode.value = __SPNS__selectedContent.contentType;
        __SPNS__handleTypeSelectChange();

    });
}

function __SPNS__handleTypeSelectChange() {
    var listOrContent = __SPNS__selectedContent.contentMode == contentModeContent ? "content" : "list";
    var contentType = __SPNS__contentTypeSelector.value;
    if (contentType) {
        __SPNS__selectedContent.contentType = contentType;
        __SPNS__populateTemplatePicker(__SPNS__selectedContent.contentType, listOrContent);
    }
    __SPNS__populateContentPicker();
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