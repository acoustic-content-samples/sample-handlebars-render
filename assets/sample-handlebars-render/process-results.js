/*
 * Copyright IBM Corp. 2016,2017
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

"use strict";

// examples of processing results before rendering
var renderer = new WCHRenderer({
    searchResultsProcessor: processSearchResults,
    contentResultsProcessor: processContentResults,
    baseTenantURL: '{Tenant API URL}'
});

// do initial render when page finishes loading
renderer.renderAll();

/*
    make a simple element value for the leaf category from this:
    "category" : {
        "elementType" : "category",
        "categoryIds" : [ "911cf1415a408d9655659d01d34d04a1" ],
        "categories" : [ "Article/Lifestyle" ]
      },
*/
function makeSimpleCategoryValue(contentItem) {
    var cat = contentItem.elements.category.categories[0];
    var idx = cat.lastIndexOf('/');
    var shortCat  = cat.substring(idx + 1);
    contentItem.elements.category.value = shortCat;
}

// This is called by renderer code before doing Handlebars render
function processSearchResults(searchResults) {
    for (var i = 0; i < searchResults.length; i++) {
    	var doc = searchResults[i];
        makeSimpleCategoryValue(doc);
    }
	return searchResults;
}

// This is called by renderer code before doing Handlebars render
function processContentResults(contentResults) {
    makeSimpleCategoryValue(contentResults);
    // console.log('contentItem', JSON.stringify(contentItem, "", 2));
    return contentResults;
}

function updateContentItem(itemLocationId) {
	renderer.processContentId(document.getElementById(itemLocationId));
}

function updateSearch(searchLocationId) {
    renderer.processSearch(document.getElementById(searchLocationId));
}
