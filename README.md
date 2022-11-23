PDF Annotator:
The PDF Annotator is a frontend web application that allows users to load their own PDF's and annotate using several features including  text, a drawing brush, an eraser, a grab tool, a clear page button, a color selector and a font/brush size selector. There are also functions to zoom in and out of the PDF.
Once the user has annotated, they can then save their annotated PDF. This application is a HTML/CSS and Javascript application that utilizes the PDF.js, jsPDF and annotatePDF libraries.

Zoom:
The left button zooms out by a factor of 1.1 when pressed.
The right button zooms in by a factor of 1.1 when pressed.

Font Size:
This selector will adjust the initial font size when using the text tool, but it can always be resized later.

Brush Size:
This selector will adjust the brush size when using the brush tool, but it can always be resized later. There is a bug with fabric.js where is has trouble calculating the position of the frabic object when resizing the brush.

Color Selector:
Each circle allows you to select which color will be applied for the next text/brush object the user creates.

Grab:
Enabling this tool by clicking on it will allow you to grab, resize and rotate objects that have already been created (the brush strokes and the text).

Text:
Enabling this tool and then clicking on the PDF will create a generic "Sample Text" of the color and size selected before. This can then be changed to desired text and resized. Once the use has clicked, the active tool will return to the grab tool.

Draw:
Enabling this tool by clicking on it will allow the user to draw on the PDF using the color and size previously selected. These can be resized with the grab tool.

Erase:
Enabling this tool will allow users to click on objects on the PDF to delete them.

Clear Page:
Clicking on this will enable a pop-up asking to confirm the action. Once the user has confirmed, all objects on the current ACTIVE page will be deleted.

Save:
Clicking this will save the annotated PDF to the user's default downloads folder.

