//SETTING UP PDF RENDER AND MAKING FABRIC.JS VERSIONS
var PDFAnnotate = function(container_id, url, options = {}) {

	this.pages_rendered = 0;
	this.active_tool = modes.grab;
	this.url = url;
	this.container_id = container_id;
	this.fabricObjects = [];
	this.fabricObjectsData = [];
	this.active_canvas = 0;
	this.font_size = 16;
	this.active_color = '#000000';
	this.brush_size = 4;
	var inst = this;

	var loadingTask = pdfjsLib.getDocument(this.url);
	loadingTask.promise.then(function(pdf) {
		inst.number_of_pages = pdf.numPages;

		for (var i = 1; i <= pdf.numPages; i++) {
			pdf.getPage(i).then(function(page) {

				var scale = 1.5;
				var viewport = page.getViewport({scale:scale});
		
				var canvas = document.createElement('canvas');
				document.getElementById(inst.container_id).appendChild(canvas);
				canvas.className = 'pdf-canvas';
				ctx = canvas.getContext('2d');
				canvas.height = viewport.height;
				canvas.width = viewport.width;

				var renderCtx = {
					canvasContext: ctx,
					viewport: viewport
				};

				var renderTask = page.render(renderCtx);
				renderTask.promise.then(function () {
					$('.pdf-canvas').each(function (index, el) {
						$(el).attr('id', 'page-' + (index + 1) + '-canvas');
					});
					inst.pages_rendered++;
					if (inst.pages_rendered == inst.number_of_pages) inst.initFabric();
				});
			});
		}
	})

	

	this.initFabric = function () {
		var inst = this;
		let canvases = $('#' + inst.container_id + ' canvas')
	    canvases.each(function (index, el) {
	        var background = el.toDataURL("image/png");
	        var fabricObj = new fabric.Canvas(el.id);
			inst.fabricObjects.push(fabricObj);
			if (typeof options.onPageUpdated == 'function') {
				fabricObj.on('object:added', function() {
					var oldValue = Object.assign({}, inst.fabricObjectsData[index]);
					inst.fabricObjectsData[index] = fabricObj.toJSON()
					options.onPageUpdated(index + 1, oldValue, inst.fabricObjectsData[index]) 
				})
			}
	        fabricObj.setBackgroundImage(background, fabricObj.renderAll.bind(fabricObj));
	        $(fabricObj.upperCanvasEl).click(function (event) {
	            inst.active_canvas = index;
	            inst.fabricClickHandler(event, fabricObj);
			});
			fabricObj.on('after:render', function () {
				inst.fabricObjectsData[index] = fabricObj.toJSON()
				fabricObj.off('after:render')
			})

			if (index === canvases.length - 1 && typeof options.ready === 'function') {
				options.ready()
			}
		});



	}

	
	this.fabricClickHandler = function(event, fabricObj) {
		var inst = this;
	    if (inst.active_tool == modes.text) {
	        var text = new fabric.IText('Sample text', {
	            left: event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
	            top: event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
	            fill: inst.active_color,
	            fontSize: inst.font_size,
	            selectable: true
	        });
	        fabricObj.add(text);
	        inst.active_tool = modes.grab;
	    }
	}
}

//METHODS FOR TOOLS

PDFAnnotate.prototype.enableGrab = function () {
	var inst = this;
	inst.active_tool = modes.grab;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
}

PDFAnnotate.prototype.enableText = function () {
	var inst = this;
	inst.active_tool = modes.text;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
}

PDFAnnotate.prototype.enableDraw = function () {
	var inst = this;
	inst.active_tool = modes.draw;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
			fabricObj.freeDrawingBrush.color = inst.active_color;
			fabricObj.freeDrawingBrush.width = parseInt(inst.brush_size, 10);
	        fabricObj.isDrawingMode = true;
			fabricObj.perPixelTargetFind = true;
	    });
	}
}

PDFAnnotate.prototype.erase = function () {
	var inst = this;
	inst.active_tool = modes.erase;
	$.each(inst.fabricObjects, function (index, fabricObj) {
		fabricObj.isDrawingMode = false;
	});
	inst.fabricObjects[this.active_canvas].on('mouse:down', () => {
		var activeObject = inst.fabricObjects[inst.active_canvas].getActiveObject();
		inst.fabricObjects[inst.active_canvas].remove(activeObject);
	});
}

PDFAnnotate.prototype.disableErase = function () {
	var inst = this;
	inst.fabricObjects[this.active_canvas].off('mouse:down');
}

PDFAnnotate.prototype.clearPage = function () {
	var inst = this;
	var fabricObj = inst.fabricObjects[inst.active_canvas];
	var bg = fabricObj.backgroundImage;
	if (confirm('Do you want to clear the page?')) {
	    fabricObj.clear();
	    fabricObj.setBackgroundImage(bg, fabricObj.renderAll.bind(fabricObj));
	}
}

PDFAnnotate.prototype.changeFontSize = function (fontInput) {
	this.font_size = fontInput;
}

PDFAnnotate.prototype.changeColor = function (colorInput) {
	var inst = this;
	inst.active_color = colorInput;
	$.each(inst.fabricObjects, function (index, fabricObj) {
        fabricObj.freeDrawingBrush.color = colorInput;
    });
}

PDFAnnotate.prototype.changeBrushSize = function (brushInput) {
	var inst = this;
	$.each(inst.fabricObjects, function (index, fabricObj) {
	    fabricObj.freeDrawingBrush.width = brushInput;
	});
}

PDFAnnotate.prototype.save = function (name) {
	var inst = this;
	var doc = new jspdf.jsPDF();
	inst.fabricObjects.forEach(function (fabricObj, index) {
		if (index != 0) {
			doc.addPage();
			doc.setPage(index+1);
		}
		doc.addImage(
			fabricObj.toDataURL({
				format: 'png'
			}), 
			inst.pageImageCompression == "NONE" ? "PNG" : "JPEG", 
			0, 
			0,
			doc.internal.pageSize.getWidth(), 
			doc.internal.pageSize.getHeight(),
			`page-${index + 1}`, 
		);
		if (index === inst.fabricObjects.length - 1) {
			doc.save(name);
			/* 

			instead of saving must output
			https://stackoverflow.com/questions/30918682/how-to-upload-pdf-to-server-from-ajax-data-send-using-jspdf
			https://stackoverflow.com/questions/51786132/how-to-save-pdf-file-from-jspdf-on-a-server-in-javascript

			var final = doc.output()
			$.ajax({
  				method: "POST",
 				url: "server link",
 				data: {data: pdf},
			}).done(function(data){
   				console.log(data);
			});
			*/
		}
	})
}

//CONNECTION TO THE HTML

function changeActiveTool(event) {
    var element = $(event.target).hasClass("tool-button")
      ? $(event.target)
      : $(event.target).parents(".tool-button").first();
    $(".tool-button.active").removeClass("active");
    $(element).addClass("active");
}

function enableGrab(event) {
    event.preventDefault();
	pdf.disableErase();
    changeActiveTool(event);
    pdf.enableGrab();
}

function enableText(event) {
    event.preventDefault();
	pdf.disableErase();
    changeActiveTool(event);
    pdf.enableText();
}

function enableDraw(event) {
	event.preventDefault();
	pdf.disableErase();
	changeActiveTool(event);
	pdf.enableDraw();
}

function erase(event) {
	event.preventDefault();
	changeActiveTool(event);
	pdf.erase();
}

function clearPage() {
	pdf.clearPage();
}

function savePDF() {
	pdf.save('annotated.pdf');
}

const modes = {
	grab: 'grab',
	text : 'text',
	draw : 'draw',
	erase : 'erase',
}

$(function () {
    $('#font-size').change(function () {
        var font_size = $(this).val();
        pdf.changeFontSize(font_size);
    });

	$('.color-tool').click(function () {
		$('.color-tool.active').removeClass('active');
        $(this).addClass('active');
		da_color = $(this).get(0).style.backgroundColor;
		pdf.changeColor(da_color);
	});

	$('#brush-size').change(function () {
		var brush_size = $(this).val();
		pdf.changeBrushSize(brush_size);
	});

	$('#zoomin').click(function () {
		var canvases = document.getElementsByClassName("pdf-canvas");
		var width = canvases[0].clientWidth;
		var height = canvases[0].clientHeight;
		for(var i = 0; i < canvases.length; i++) {
			canvases[i].style.width = width * 1.1 + "px";
			canvases[i].style.height = height * 1.1 + "px";
		}
	})

	$('#zoomout').click(function () {
		var canvases = document.getElementsByClassName("pdf-canvas");
		var width = canvases[0].clientWidth;
		var height = canvases[0].clientHeight;
		for(var i = 0; i < canvases.length; i++) {
			canvases[i].style.width = width * (1/1.1) + "px";
			canvases[i].style.height = height * (1/1.1) + "px";
		}
	})
});

//CHOOSING PDF

var pdf = new PDFAnnotate("pdf-container", "pdf.pdf", {
	onPageUpdated(page, oldData, newData) {
	  console.log(page, oldData, newData);
	},
	ready() {
	  console.log("Ready");
	},
	scale: 1.5,
});