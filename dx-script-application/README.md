## WCH rendered content sample script application for IBM Digital Experience

This is a sample script application for IBM Digital Experience (DX) 8.5 or 9.0. It lets you display a content item or search results for a selected content type on a DX page. To render the content it uses Handlebars templates that are stored in WCH.

### NOTE: For rendering WCH content in DX, you should now use the following sample instead: https://github.com/digexp/sample-wch-handlebars-render

To install into DX 8.5/9.0:
- The rendering and template support used by this app are from the containing sample-handlebars-render project. You mush first install that into your WCH tenant before using this script application.
- You will need to have Script Application command line "sp" installed as described in the Script Application documentation.
- Download the dx-script-application folder.
- Edit index.html and provide values for your base tenant API URL and server root URL.
- Call "sp push" from the folder containing index.html to push the contents of that folder as a script application.
- With a page in edit mode, bring up the toolbar and find the page component called "WCH Rendered Content Sample" and add it to the page.
- Tae the page out of edit mode and close the toolbar.
- Click on the button "Select Content From Watson Content Hub" to configure the application, then click Save.
- Your content or search results should be displayed.
- To bring up the configuration dialog to change the configuration, shift-click anywhere on the application.

Note that the Handlebars library used for rendering can conflict with Dojo, so for example, the rendering won't work in Digital Experience when the page is in edit mode. Also note that most of the sample templates currently use Bootstrap styling, which may change some of the Portal theme styling.

The available templates are in the hbs-templates folder of that project. There are currently templates provided for "Article" content type. You can add templates for other content types as described in the main readme for this project.

This screenshot shows a Portal page with two instances of this application. The top instance shows a single "Hero Banner" content item and the bottom instance shows a search for articles.
![Alt text](../docs/dx-script-app.jpg?raw=true "Sample screenshot")

This shows the configuration UI for selecting content item or search parameters.
![Alt text](../docs/dx-script-app-configuration.jpg?raw=true "Sample configuration screenshot")

