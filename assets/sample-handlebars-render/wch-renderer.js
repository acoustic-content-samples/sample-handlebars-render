/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
"use strict";

class WCHRenderer {

    constructor(settings) {
        this.baseTenantURL = settings.baseTenantURL;
        this.debug = (settings.debug ? settings.debug: false);
        this.baseTemplateUrl = settings.baseTemplateUrl;    // use to override location of template files
        this.searchResultsProcessor = settings.searchResultsProcessor; // callback for any extra processeing needed
        this.contentResultsProcessor = settings.contentResultsProcessor; // callback for any extra processeing needed

        (() => {
            // get server root URL from base API URL
            let i = this.baseTenantURL.indexOf("://");
            if (i > -1) {
                var iSlash = this.baseTenantURL.indexOf('/', i + 3);
                this.baseServerURL = this.baseTenantURL.substring(0, iSlash);
            } else {
                throw new Error("Invalid URL: " + this.baseTenantURL);
            }
        })();
    }

    // Renders all wch-data-content-id and wch-data-content-search tags
    renderAll() {
        let renderer=this;
        if (!window.wchContentAlreadyRendered) {
            window.wchContentAlreadyRendered = true;
            document.addEventListener("DOMContentLoaded", (function() {
                renderer.renderItems();
                renderer.renderAllSearches();
            }));
        }
    }

    // Render specified content item using specified remote template, at the tag with ID displayLocationId
    renderItem(contentId, template, displayLocationId) {
        var targetNode = document.getElementById(displayLocationId);
        if (!targetNode) {
            console.log("Can't find element with ID ", displayLocationId);
            return;
        }
        this.renderContentWithTemplate(contentId, template, targetNode);
    }

    // Render specified search using specified remote template, at the tag with ID displayLocationId
    renderSearch(searchParams, template, displayLocationId) {
        var targetNode = document.getElementById(displayLocationId);
        if (!targetNode) {
            console.log("Can't find element with ID ", displayLocationId);
            return;
        }
        this.processSearchForParams(searchParams, template, targetNode);
    }

    // Render any tags with attribute wch-data-content-id
    renderItems() {
        // find tags with data-wch-content-id
        let nodes = document.querySelectorAll('[data-wch-content-id]');
        for (var i = 0; i < nodes.length; ++i) {
            this.processContentId(nodes[i]);
        }
    }

    // Render any tags with attribute wch-data-content-search
    renderAllSearches() {
        // find tags with data-wch-content-search
        let nodes = document.querySelectorAll('[data-wch-content-search]');
        for (var i = 0; i < nodes.length; ++i) {
            this.processSearch(nodes[i]);
        }
    }

    // Render a node that includes data-wch-content-search
    processSearch(targetNode) {
        let searchParams = targetNode.getAttribute("data-wch-content-search");
        let remoteTemplateName = targetNode.getAttribute("data-wch-remote-template-name");
        this.processSearchForParams(searchParams, remoteTemplateName, targetNode);
    }


    // Render a node that includes data-wch-content-id
    processContentId(targetNode) {
        var id = targetNode.getAttribute("data-wch-content-id");
        var remoteTemplateName = targetNode.getAttribute("data-wch-remote-template-name");
        this.renderContentWithTemplate(id, remoteTemplateName, targetNode);
    }

    processSearchForParams(searchParams, remoteTemplateName, targetNode) {
        // get the template
        let template = null;
        if (!remoteTemplateName) {
            template = targetNode.innerHTML;
        }
        let renderer = this;
        // console.log('template: ', template);
        return this.getSearchResults(searchParams).
        then(searchResults => {
            // console.log("Delivery search response: " + JSON.stringify(searchResults, null, ' '));
            var documents = searchResults.documents;
            // console.log('template: ', template);
            if (template) {
                console.log('Rendering with local template, search: ', searchParams);
                renderer.renderSearchList(targetNode, documents, template);
            }
            else if (remoteTemplateName) {
                if (remoteTemplateName == '#default' && documents) {
                    if (documents.length > 0) {
                        remoteTemplateName = '/sample-handlebars-render/hbs-templates/list/' + documents[0]['document'].type + '/default.hbs';
                    }
                }
                console.log('Rendering with remote template ', remoteTemplateName, ' searchParams:', searchParams);
                // console.log('remote template ', remoteTemplateName);
                return renderer.getAssetByPath(remoteTemplateName).
                then(template => {
                    // console.log("remote template: " + template);
                    if (template) {
                        renderer.renderSearchList(targetNode, documents, template);
                    }
                });
            }
        });
    }


    getSearchResults(searchParams) {
        searchParams = searchParams.replace(' ', '%5C ');
        console.log('searchParams', searchParams);
        const baseSearchParams = "q=*:*&fl=id,document:[json]&fq=classification:(content)";
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = resolve;
            req.onerror = function(err) {
                reject("Network Error");
            };
            const url = this.baseTenantURL + '/delivery/v1/search?' + baseSearchParams + '&' + searchParams;
            req.open("GET", url);
            req.send();
        }).
        // extract the XHR from the event
        then(event => event.target).
        // extract the response body from the xhr request
        then(req => req.responseText).
        // parse the JSON
        then(JSON.parse);
    }

    renderSearchList(targetNode, documents, template) {
        // console.log('template: ', template);
        var compiledTemplate = Handlebars.compile(template);
        this.fixContentUrls(documents);

        var searchResults = [];
        if (documents) {
            for (var i = 0; i < documents.length; i++) {
                searchResults.push(documents[i]["document"]);
            }
            if (this.searchResultsProcessor) {
                searchResults = this.searchResultsProcessor(searchResults);
            }
            // console.log('searchResults ', JSON.stringify(searchResults, "", 4));
            var html = compiledTemplate({
                searchResults
            });
            this.updateRenderedInlineHtml(targetNode, html);
        }
    }

    // Populate HTML at targetNode. For inline SCRIPT template, make new node before SCRIPT node
    updateRenderedInlineHtml(targetNode, html) {
        if (targetNode.nodeName == "SCRIPT") {
            // see if previous node has data-wch-content-rendered attribut
            var previous = targetNode.previousElementSibling;
            if (previous && previous.getAttribute("data-wch-content-rendered")) {
                // remove 
                previous.parentElement.removeChild(previous);
            }

            // add in DIV before
            html = '<div data-wch-content-rendered="true">' + html + '</div>';
            targetNode.insertAdjacentHTML('beforebegin', html);
            // targetNode.innerHTML = "";
        }
        else {
            targetNode.innerHTML = html;
        }
    }

    renderContentWithTemplate(id, remoteTemplateName, targetNode) {
        // console.log('templateId ', templateId, ' remoteTemplateName ', remoteTemplateName, ' id ', id);
        // get the template
        var template = null;
        if (!remoteTemplateName) {
            template = targetNode.innerHTML;
        }
        let renderer = this;
        // console.log('template: ', template);
        return this.getContentById(id).
        then(content => {
            // console.log("Delivery Content response: " + JSON.stringify(content, null, ' '));
            // console.log('template: ', template);
            if (template) {
                console.log('Rendering with local template, content: ', id);
                renderer.renderContentItem(targetNode, content, template);
            }
            else if (remoteTemplateName) {
                if (remoteTemplateName == '#default') {
                    remoteTemplateName = '/sample-handlebars-render/hbs-templates/content/' + content.type + '/default.hbs';
                }
                console.log('Rendering with remote template ', remoteTemplateName, ' content:', id);
                // console.log('remote template ', remoteTemplateName);
                return renderer.getAssetByPath(remoteTemplateName).
                then(template => {
                    // console.log("remote template: " + template);
                    if (template) {
                        renderer.renderContentItem(targetNode, content, template);
                    }
                });
            }
        });
    }

    getContentById(contentId) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = resolve;
            req.onerror = function(err) {
                reject("Network Error");
            };
            const url = this.baseTenantURL + '/delivery/v1/content/' + contentId;
            req.open("GET", url);
            req.send();
        }).
        // extract the XHR from the event
        then(event => event.target).
        // extract the response body from the xhr request
        then(req => req.responseText).
        // parse the JSON
        then(JSON.parse);
    }

    getAssetByPath(assetPath) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onload = resolve;
            req.onerror = function(err) {
                reject("Network Error");
            };
            var url = this.baseTenantURL + '/delivery/v1/resources?path=' + assetPath;
            if (this.baseTemplateUrl) {
                url = this.baseTemplateUrl + assetPath;
            }
            console.log('asset url: ', url);
            req.open("GET", url);
            req.send();
        }).
        // extract the XHR from the event
        then(event => event.target).
        // extract the response body from the xhr request
        then(req => req.responseText);
    }

    renderContentItem(targetNode, contentItem, template) {
        var compiledTemplate = Handlebars.compile(template);
        this.fixContentUrls(contentItem);
        let renderer = this;
        if (this.contentResultsProcessor) {
            contentItem = renderer.contentResultsProcessor(contentItem);
        }
        var html = compiledTemplate(contentItem);
        this.updateRenderedInlineHtml(targetNode, html);
    }

    // Add server to URLs within content item
    fixContentUrls(obj) {
        for (var k in obj) {
            if (k == 'url') {
                // console.log('url  ', obj[k]);
                obj[k] = this.baseServerURL + obj[k];
            }
            if (typeof obj[k] == "object" && obj[k] !== null) {
                this.fixContentUrls(obj[k]);
            }
            else {}
        }
    }
}
