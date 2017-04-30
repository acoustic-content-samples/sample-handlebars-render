/*
 * Copyright IBM Corp. 2016, 2017
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

// Express server that serves static files for testing template rendering locally

var express = require('express');
var fs = require('fs');

var app = express();
var path = require('path');
var url = require('url');
const publicPath = 'assets/sample-handlebars-render';
const templatePath = './' + publicPath + '/hbs-templates';

/* serves all the static files in the assets/sample-handlebars-render folder */
app.use(express.static(path.join(__dirname, publicPath)));

/* Requests for /sample-handlebars-render also go to assets/sample-handlebars-render folder */
app.use('/sample-handlebars-render', express.static(publicPath));

// Get list of templates from file system
function getTemplateList(dir, filelist) {
    if (!dir.endsWith('/')) {
        dir = dir.concat('/');
    }

    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = getTemplateList(dir + file + '/', filelist);
        }
        else if (!file.startsWith('.')) {
            // To match what client JS does, path starts with '/sample-handlebars-render'
            var templateName = (dir + file).replace('./assets', '');
            filelist.push(templateName);
        }
    });
    return filelist;
};

// Return the template list to the browser
app.get('/api/getTemplateList', function(request, response) {
    var body = JSON.stringify(getTemplateList(templatePath, []), "", 2);
    // console.log(body);
    response.type('json');
    response.send(body);
})


app.listen(3003, function() {
    console.log('Listening on port 3003');
    console.log('Sample Express server for testing Handlebars templates locally');
    console.log('Sample of previewing local or remote templates: ');
    console.log('    http://localhost:3003/template-preview.html');
    console.log('Sample showing in-line template support in HTML page: ');
    console.log('    http://localhost:3003/index-inline.html');
    console.log('Sample showing remote template support in HTML page: ');
    console.log('    http://localhost:3003/index-content-spot.html');
});