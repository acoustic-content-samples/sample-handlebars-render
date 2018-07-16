/*
 * Copyright 2016  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */
"use strict";

// Base URL for APIs - replace {Host} and {Tenant ID} using the values available 
// from the "i" information icon at the top left of the WCH screen 
const baseTenantUrl = "{Tenant API URL}";

// Set this to the delivery URL for your tenant:
const tenantDeliveryUrl = "{Tenant Delivery URL}";
const rendererJs = tenantDeliveryUrl + "/sample-handlebars-render/wch-renderer.js";

const wchLoginURL = baseTenantUrl + "/login/v1/basicauth";

// Content Hub blueid username and password - replace these or add code to get these from inputs
const username = "[username]";
const password = "[password]";

function wchLogin(myhandler, pickerUrl) {
    var requestOptions = {
        xhrFields: {
            withCredentials: true
        },
        url: wchLoginURL,
        headers: {
            "Authorization": "Basic " + btoa(username + ":" + password)
        }
    };

    $.ajax(requestOptions).done(function(data, textStatus, request) {
        // These cookies received on successful login : 'x-ibm-dx-user-auth', x-ibm-dx-tenant-id' 
        // Now that you are logged in and have the cookies, open the picker
        launchPicker(myhandler, pickerUrl);

    }).fail(function(request, textStatus, err) {
        alert("Content Hub Login returned an error: " + err + ". Please check your credentials.");
    });
}


// 1. 'addEventListener' is for standards-compliant web browsers and 'attachEvent' is for IE Browsers
var eventMethod = window.addEventListener ? 'addEventListener' : 'attachEvent';
var eventer = window[eventMethod];
// 2. if 'attachEvent', then we need to select 'onmessage' as the event
// else if 'addEventListener', then we need to select 'message' as the event
var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message';

var wchRenderer = new WCHRenderer({
    baseTenantURL: baseTenantUrl
});

function launchPicker(myhandler, url) {
    // Populate select list for templates
    getTemplateList();

    $('#pickerDialog').dialog({
        autoOpen: false,
        show: 'fade',
        hide: 'fade',
        modal: false,
        height: window.innerHeight - 30,
        resizable: true,
        minHeight: 500,
        width: 240,
        position: {
            my: 'right center',
            at: 'right center',
            of: window
        },
        open: function() {
            $('#pickerIframe').attr('src', url);
        },
        title: 'Find',
    });

    // Listen to message from child iFrame window
    eventer(messageEvent, myhandler, false);

    //open the dialog
    $('#pickerDialog').dialog('open');
}

const templateFolder = "/sample-handlebars-render/hbs-templates";
const defaultTemplateName = "default.hbs";
var selectedContentId = null;

var availableTemplates = [];

// Update complete list of availableTemplates
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

function populateTemplatePicker(contentType, contentOrList) {
    var filter = templateFolder + "/" + contentOrList + "/" + contentType + "/";
    var options = '<option value="#default">Default</option>';
    var numAvailableTemplates = 0;
    for (var i = 0; i < availableTemplates.length; i++) {
        var template = availableTemplates[i];
        if (template.startsWith(filter)) {
            numAvailableTemplates++;
            var shortName = template.replace(filter, "");
            if (shortName != defaultTemplateName) {
                options = options + '<option value="' + template + '">' + shortName + '</option>';
            }
        }
    }
    $('#templateSelector').html(options);
    return numAvailableTemplates;
}

var availableListTypes = [];

function initTypeSelector() {
    getTemplateList().
    then(searchResults => {
        // console.log('results: ', availableTemplates);
        availableListTypes = [];
        var options = '<option value=""></option>';
        var filter = templateFolder + "/list/";
        for (var i = 0; i < availableTemplates.length; i++) {
            var template = availableTemplates[i];
            if (template.startsWith(filter)) {
                var remainingPath = template.replace(filter, "");
                var idx = remainingPath.indexOf('/');
                var typeName = remainingPath.substring(0, idx);
                if (availableListTypes.indexOf(typeName) < 0) {
                    availableListTypes.push(typeName);
                    // console.log('typeName', typeName);
                    options = options + '<option value="' + typeName + '">' + typeName + '</option>';

                }
            }
        }
        // console.log('options', options);
        $('#contentTypeSelector').html(options);

    });
}

function handleTypeSelectChange(select) {
    populateTemplatePicker(select.value, "list")
}

function handleTemplateSelectChange(select) {
    // Don't need to do anything at the moment
}

function generateSearchSnippet() {
    // console.log("generateSearchSnippet");


    var searchParams = "fq=type:" + contentTypeSelector.value + "&sort=lastModified%20desc&rows=" + rowsInput.value;
    // See if search tags specified
    var tags = [];
    var tagsString = tagsInput.value;
    if (tagsString) {
        tags = tagsString.split(',');
    }
    // console.log('tags: ', JSON.stringify(tags, null, 4));
    if (tags.length > 0) {
        searchParams = searchParams + "&fq=tags:(" + tags.join(' OR ') + ')';
    }
    // add tags to search: &fq=tags:(beach OR summer)
    // console.log('searchParams ', searchParams);
    wchRenderer.renderSearch(searchParams, templateSelector.value, 'result');
    // wchRenderTemplatedSearch(baseTenantUrl, searchParams, templateSelector.value, 'result');
    $('#code-snippet').html(escapeHtml(makeSearchSnippet(searchParams, templateSelector.value)));
}

//handle how the chosen content item is displayed on the page
function resultHandler(e) {
    $('#pickerDialog').dialog('close');

    var result = JSON.parse(e.data);
    //construct the snippet and display
    var id = result.id.replace("content:", "");
    selectedContentId = id;
    templateSelector.value = "#default";
    var numAvailableTemplates = populateTemplatePicker(result['document'].type, "content");
    if (numAvailableTemplates > 0) {
        wchRenderer.renderItem(id, templateSelector.value, 'result');
    }
    else {
        $('#result').html('No templates available for selected content');
    }

    $('#code-snippet').html(escapeHtml(makeSnippet(id, templateSelector.value)));
}

function handleSelectChange(select) {
    wchRenderer.renderItem(selectedContentId, select.value, 'result');
    $('#code-snippet').html(escapeHtml(makeSnippet(selectedContentId, templateSelector.value)));

}

function makePreviewSnippet(id) {
    var html =
        '<div data-wch-content-id="' + id + '"data-wch-remote-template-name="#default">' + '</div>';
    return html;
}

function makeSnippet(id, template) {
    var html = '<!-- Insert in HEAD of page -->\n' + '<script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.6/handlebars.min.js"></script>\n' + '<script src="' + rendererJs + '"></script>\n' + '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">\n' + '<script type="text/javascript">\n' + 'new WCHRenderer({ baseTenantURL: "' + baseTenantUrl + '"' + '}).renderAll();' + '</script>\n' + '\n<!-- Insert where you want results rendered -->\n' + '<div data-wch-content-id="' + id + '" data-wch-remote-template-name="' + template + '">\n' + '</div>';
    return html;
}

function makeSearchSnippet(searchParams, template) {
    var html = '<!-- Insert in HEAD of page -->\n' + '<script src="https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.0.6/handlebars.min.js"></script>\n' + '<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>\n' + '<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>\n' + '<script src="' + rendererJs + '"></script>\n' + '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">\n' + '<script type="text/javascript">\n' + 'new WCHRenderer({ baseTenantURL: "' + baseTenantUrl + '"' + '}).renderAll();;' + '</script>\n' + '\n<!-- Insert where you want results rendered -->\n' + '<div data-wch-content-search="' + searchParams + '" data-wch-remote-template-name="' + template + '">\n' + '</div>';
    return html;
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