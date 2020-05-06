# sample-handlebars-render
Helper code for automatic client-side template rendering of content items and search results from Acoustic Content using Handlebars. 

## Introduction

This library supports two ways of using Handlebars rendering with content and search results from Acoustic Content (formerly Watson Content Hub or WCH):

1. You can enable inline Handlebars references in any HTML page, to easily convert static text and image references to dynamic content from WCH.

2. You can include live "dynamic content spots" in any HTML page to automatically retrieve and render WCH content or search results using Handlebars templates. 

For either approach, you can access either a single content item, specified by content ID, or a list of search results, using Content Hub's powerful search service parameters.

This project also includes:
- Two "snippet generators" for generating content spots, for single content item and for search.
- A simple Express server and HTML page for previewing Handlebars template files locally.
 
## Enabling in-line Handlebars support for an HTML page

This feature lets you easily take an existing HTML page and inject dynamic text or images from Content Hub when the page is loaded. For example, you might have a page with a static banner section like this:

          <div class="jumbotron" style="background-image: url(./header-background.jpg);">
            <h1>Hello, world!</h1>
            <p style="width: 60%;">This is static text for a banner display.</p>
            <p><a href="#" class="btn btn-primary btn-large">Learn more &raquo;</a></p>
          </div>

To make that banner use dynamic content from Content Hub, add the data-wch-content-id attribute to a surrounding tag. You can then reference any content item elements using Handlebars syntax. Now when the page is displayed, the heading will be taken from the "title" element of the content item, and the background image will use the "image" element of the content item:

        <script type="text/x-handlebars-template" data-wch-content-id="b755dfdd-0fb3-40ac-8103-23a4a2bc33a7">
            <div class="container jumbotron" style="background-image: url({{elements.image.url}});">
                <h1>{{elements.title.value}}</h1>
                <p style="width: 60%;">{{elements.summary.value}}</p>
                <p><a href="https://developer.goacoustic.com/acoustic-content/docs" target="_blank" class="btn btn-primary btn-large">Learn more &raquo;</a></p>
            </div>
        </script>

For a content item, you can reference "elements" or other members of the content item, for example elements.title.value or elements.image.url.

You can also diplay a list of search results. For this, set the data-wch-search-params attribute value to the search parameters you want to use. You can specify "fq" parameters to search for a particular content type or specific tags, and you can specify how many results to retrieve with the "rows" parameter. For information on search parameters see the Delivery Search documention in the API Explorer.

        <!-- Example row of columns -->
        <!-- Gets search results and renders with Handlebars -->
        <script type="text/x-handlebars-template" data-wch-content-search="fq=type:Article&sort=lastModified%20desc&rows=3">
            <div class="row">
                {{#each searchResults}}
                <div class="col-md-4">
                    <h2>{{elements.title.value}}</h2>
                    <p>{{elements.summary.value}}</p>
                    <p><a class="btn btn-default" href="#" role="button">View details »</a></p>
                </div>
                {{/each}}
            </div>
        </script>
        
The two examples above (for a single content item and for search results) can be seen in the file index-inline.html.

This shows what index-inline.html looks like when running.
![Alt text](/docs/index-inline-screenshot.jpg?raw=true "Sample screenshot")

## Using dynamic content spots

Dynamic content spots are rendered with .hbs templates that are stored in WCH. Each template is associated with a specific content type, for displaying either a single content item or a list of search results. You can have any number of template variations for a content type.

To use a content spot in an HTML page, include a tag with attributes that specify the data to retrieve and the template to use for rendering. For a single content item, you specify the content item ID; for search results, you specify the search query parameters to use.

As an example of a content spot for a single content item, this tag will retrieve one "Article" content item and render it using a default template:

    <div data-wch-content-id="4a7ef8ec-5632-4e40-aa06-fac9eab2d93f" data-wch-remote-template-name="#default">

Each content type will have a default template, in the location shown below in the "Creating templates" section. To use a specific template, you would reference it like this:

    <div data-wch-content-id="4a7ef8ec-5632-4e40-aa06-fac9eab2d93f" data-wch-remote-template-name="/hbs-templates/content/Article/text-overlaid.hbs">

As an example of rendering search results, the following tag will retrieve the three most recently modified Article content items and render them with a default template:

    <div data-wch-content-search="fq=type:Article&sort=lastModified%20desc&rows=3" data-wch-remote-template-name="#default">

To use a specific rendering template you would do this:

    <div data-wch-content-id="76d4faae-6a61-44f8-94f9-5e94f5a6531c" data-wch-remote-template-name="/sample-handlebars-render/hbs-templates/content/Article/text-overlaid.hbs">

The two examples above can be seen in the file index-content-spot.html.

## Loading and initializing the library

To use this rendering support in an HTML page, you need to initialize the helper library and call one function to render content when the page is loaded. Here are the steps:

1. Include the helper JS, wch-renderer.js, with a script tag in your HTML. 

2. Add a script tag to initialize the helper and enable rendering. Specify your base tenant URL like this:

        <script type="text/javascript">
        new WCHRenderer({ baseTenantURL: 'https://my12.digitalexperience.ibm.com/api/12345678-9abc-def0-1234-56789abcdef0'}).renderAll();
        </script>
    
## Creating templates for dynamic content spots

This sample expects to find rendering template files in the folder /samples-handlebars-render/hbs-templates/ of your Content Hub tenant. To publish these templates you will use the wchtools utility with its web app asset support. The folder structure under hbs-templates is:

    /content/[content-type]/default.hbs
    /content/[content-type]/[other templates].hbs
    /list/[content-type]/default.hbs
    /list/[content-type]/[other templates].hbs

The provided sample templates are for the Article content type.

You can also override the root location for templates used by content spots. To do this, add a value for "templateBaseUrl" to the settings object that is passed to the constructor for WCHRenderer. For example, if you use ".", it will load templates from the same location as the HTML page you are using. This is a convenient technique for testing templates that you are working on, without having to update them in the WCH system.

## Using the snippet generators

There are two sample "snippet generators" that let you pick content and a template and generate the HTML tags for a dynamic content spot. The generated snippets can be copied and pasted into an HTML page to render the selected content or search results.

## Installing and running the samples

#### 1. Download the files

Download the entire project folder into any folder on your workstation.

#### 2. Update the values in each sample to match your tenant

These files have values that need to be updated for your tenant:
- carousel-content-spot.html
- carousel-inline.html
- index-content-spot.html
- index-inline.html
- snippet-generator.js
- table-inline.html
- template-preview.html

Replace the values for {Tenant API URL} and {Tenant Delivery URL} with the values from the "Watson Content Hub Information" dialog.

In snippet-generator.js, set the values for username and password to a user with "Viewer" or more access. This is used for the content palette, which shows content from the authoring search service that requires authentication.

#### 3. Upload sample "Article" content

The templates provided with this sample use the "Article" content type. Follow the instructions at the [sample-article-content](https://github.com/ibm-wch/sample-article-content) repository, to download and push the sample article type and associated authoring artifacts, for your Content Hub tenant.

#### 4. Upload this sample into WCH

The content spot functionality uses .hbs templates that are stored in WCH. To upload them and other files:
+ Install the Watson Content Hub Command Line Tools as described here: https://github.com/ibm-wch/wchtools-cli/
+ Navigate to the download folder and run the WCH command line tool to push the sample content as follows:

```
  wchtools push -w -v
```

#### 5. Enable CORS support for your tenant

For this scenario you will need to enable CORS support for your tenant. To control the CORS enablement for Watson Content Hub, go to Hub set up -> General settings -> Security tab. After adding your domain (or "*" for any domain), be sure to click the Save button at the top right of the screen.

#### 6. Open the sample html files in a browser to try them out

You can do this right from the file system in Firefox, Chrome, or Safari browsers. 

Sample test pages:

+ index-inline.html: This shows how you can use in-line Handlebars syntax to include dynamic content or search results from WCH.
+ index-content-spot.html: This shows a similar example to the previous, but in this case it uses "content spots" with Handlebars templates that are stored in WCH.
+ carousel-inline.html: This shows a simple carousel that displays search results using the in-line Handlebars functionality.
+ carousel-content-spot.html: This shows a similar carousel to be previous, with a remote template stored in WCH.
+ table-inline.html: This shows an HTML table showing search results using the in-line templating functionality.
+ content-snippet-generator.html: This lets you use the WCH content palette to select a content item and generate a snippet of HTML that lets you insert live content into any HTML page.
+ search-snippet-generator.html: This generates a snippet of HTML for showing search results that are rendered with a template.
+ template-preview.html: This page is used for previewing and testing Handlebars templates from the local file system. It must be using with the Express server described below.
+ process-results.html: This shows how you can specify a function to do additional processing of content before it is used with Handlebars rendering.

## Previewing and testing templates locally with Express server

For previewing and testing the remote template feature (using the data-wch-remote-template-name attribute), there is a simple Express server you can use that loads templates from the local assets/sample-handlebars-render/hbs-templates folder.

To use this server:
1. Run npm install from the root project folder
2. Run node main.js to start the Express server

#### Using template-preview page for preview and test of local templates

The page template-preview.html can be used to preview template files from the local file system. To use this, you need to run the Express server as described above. Then open template-preview.html using localhost and the port of the Express server. The URL is shown in the console when you run the server.

From template-preview.html you can select any of the templates you have under the hbs-templates folder without having to push them to the WCH server first. It's a convenient way to make iterative changes to templates and view the results.

