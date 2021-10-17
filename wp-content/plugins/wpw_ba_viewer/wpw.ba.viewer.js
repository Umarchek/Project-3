/**
 * 
 * 		title:		BEFORE/AFTER VIEWER - jQuery plugin
 * 
 *		author: 	Ovidiu Stefancu
 *					http:www.wpworks.net
 					
 *
 * 		info:		File available at http://codecanyon.net/user/wickedpixel
 * 
 * 		ver:		2.0 : 2013-may-07
 */

var WPW = WPW || {};
WPW.baViewersCount = 0;
(function ($) {
	
var wpwBAgallery = function (theBody, options) {
	//	INIT
	var main = this;
	main.cfg = $.extend({},  $.fn.wpwBAgallery.defaults, options);
	main.galleryNode = $(theBody); // gallery body

	//
	main.currentIndex = 0;
	main.imageNodes = $('img', main.galleryNode).detach();
	main.nrItems = main.imageNodes.length;
	
	if(!main.nrItems){return;}
	
	
	main.galleryNode.addClass('wpw-ba-loading');
	main.galleryNode.addClass("wpw-ba-viewer-block");
	
	main.items = [];
	main.containerPosition = 0;
	main.moverMargin = 0;
	main.galleryNode.addClass('wpw-ba-viewer');
	main.mover = $("<div class='wpw-ba-mover'></div>");
	main.galleryWidth = 0;
	main.galleryHeight = 0;
	var ease = "easeInOutExpo";
	
	//
	
	var attrCheck = function(attr, doInt, doFloat){ 
		if(main.galleryNode.attr("data-"+attr)){
				main.cfg[attr] = main.galleryNode.attr("data-"+attr);
				if(main.cfg[attr] === "false"){main.cfg[attr] = false;}
				if(main.cfg[attr] === "true"){main.cfg[attr] = true;}
				if(doFloat){main.cfg[attr] = parseFloat(main.cfg[attr]);}
				if(doInt){main.cfg[attr] = parseInt(main.cfg[attr], 10);}
			} 
	}
	
	attrCheck("width");	
	attrCheck("maxWidth", 1);	
	attrCheck("maxHeight", 1);	
	attrCheck("height");	
	attrCheck("disableIntro");
	attrCheck("hideTitles");
	attrCheck("lightbox");
	attrCheck("animSpeed", 1);
	attrCheck("startPercent", 0, 1);
	
	main.setOption = function(attr, value){
		main.cfg[attr] = value;
	}
	
	//LIGHTBOX INIT
	main.lightbox = new function(){
		var lObject = this;
		
		lObject.preset = function(){
			if(lObject.isPreset){return;}
			lObject.isPreset = 1;
			lObject.node = $("<div class='wpw-ba-lightbox'></div>");
			lObject.bg = $("<div class='wpw-ba-lightbox-bg'></div>");
			lObject.node.append(lObject.bg);
			
			
			$(document).keyup(function(e) {
			  if (e.keyCode === 27 || e.keyCode === 40 || e.keyCode === 38) { 
			  		lObject.hide();
			  	 } 
			});		
			
			//ARROW KEYBOARD NAVIGATION
			$(document).keydown(function (e){
				if(!lObject.onScreen){return;}
				var way = 0;
			    if (e.keyCode === 37){ way = -1; }
			    if (e.keyCode === 39){ way = 1; }
			    if(!way){ return; }
			    
				main.gotoIndex(way);
				//return false;
			});				
			
		}
		
		lObject.show = function(){
			if(lObject.onScreen){return;}
			if(WPW.currentBALightbox){return;}
			WPW.currentBALightbox = this;
			lObject.preset();
			main.placeHolder = main.placeHolder || $("<div class='wpw-ba-placeholder' style='display:none;'></div>");
			if(!main.onlyLightbox){
				main.galleryNode.before(main.placeHolder);
			}
			
			$('body').append(lObject.node);
			lObject.node.slideUp(0);
			lObject.node.slideDown({
				duration:400,
				complete:function(){
					lObject.onScreen = 1;
					lObject.node.append(main.galleryNode);
					main.galleryNode.addClass("wpw-ba-zoom-mode");
					main.galleryNode.removeClass("wpw-ba-viewer-block");
					main.zoomMode = 1;
					main.galleryNode.fadeOut(0);
					main.galleryNode.fadeIn(500, function(){
						
					});
					main.setSize();	
				},
				easing:"easeInOutQuart"
			});

		}
		
		lObject.hide = function(){
			if(!lObject.onScreen){return;}
			
			main.galleryNode.fadeOut(500, function(){
				WPW.currentBALightbox = 0;
				main.zoomMode = 0;
				lObject.onScreen = 0;				
				main.galleryNode.detach();
				main.galleryNode.removeClass("wpw-ba-zoom-mode");
				main.galleryNode.addClass("wpw-ba-viewer-block");
				if(!main.onlyLightbox){
					main.placeHolder.after(main.galleryNode);
				} 
				main.galleryNode.fadeIn(1);
				setTimeout(function(){
					main.animateHeight(1);	
					main.setSize();
				}, 100)
				
				main.setSize();
				lObject.node.slideUp({
					duration:400,
					easing:"easeInOutQuart",
					complete:function(){
						lObject.node.detach();
					}
				});
			});		
		}
		
		lObject.toggle = function(doIndex){
			if(lObject.onScreen){
				lObject.hide();
			} else {
				if(doIndex){

					main.gotoIndex();
				}
				
				lObject.show();
			}
		}
	}
	
    	
	
	
	main.updateTitle = function(str, url, urlTarget){
		if(!str){str = "";}
		if(!main.info){return;}
		
		main.textNode = main.textNode || $('.wpw-ba-info-text', main.galleryNode);
		if(!str.length){
			main.info.addClass('wpw-ba-info-hide')	
		} else {
			main.info.removeClass('wpw-ba-info-hide');
			
			if(url){
				if(!urlTarget){
					urlTarget = "_self";
				}
				str = "<a class='wpw-ba-url' href='"+url+"' target='"+urlTarget+"'> &raquo; " + str + "</a>";
			}
			main.textNode.html(str);
		}
	}
	
	var oldHeight = 0;
	main.animateHeight = function(fast){
		oldHeight = 0;
		if(main.lightbox.onScreen){return;}
		var newHeight = 0;
		if(!main.mainPic.loaded || !main.mainPic.isLoaded()){
			newHeight = main.galleryNode.height();
		} else {
			newHeight = main.mainPic.pic.height();
		}
		
		if(oldHeight === newHeight){return false;}
		oldHeight = newHeight;
		
		main.aHeight = main.startHeight;
		
		var speed = 300;
		if(fast){
			speed = 1;
		}
		
		main.galleryNode.stop().animate({
				height: newHeight
			}, {
				duration: speed,
				step:function(){
					},
				easing: ease,
				complete:function(){
						
					}
			});
	}
	
	
	//BA VIEWER
	var baViewer = function(baNode, baIndex){
		var viewer = this;
		viewer.picA = {};
		viewer.picB = {};
		viewer.loaded = 0;
		viewer.percent = 1;
		var dragStuff = 0;
		var firstIntro = 1;
		
		viewer.update = function(){
			var doorPos = parseInt(viewer.percent * main.galleryWidth, 10);
			
			if(viewer.door){
				viewer.door.css("left", doorPos);
				viewer.picBox.css("left", -doorPos - 1);
			}
		}
		
		
		viewer.introAnimTimer = 0;
		viewer.introAnim = function(){
			WPW.baViewersCount +=1;
			
			firstIntro = 0;
			var ease = "easeInOutExpo";
			if(main.cfg.disableIntro === true){
				$(viewer).delay(200 * WPW.baViewersCount).animate({
					percent: main.cfg.startPercent
				}, {
					duration: main.cfg.animSpeed,
					step:function(){
						viewer.update();
						},
					easing: ease,
					complete:function(){
							viewer.update();
							WPW.baViewersCount -=1;
							if(WPW.baViewersCount < 0){WPW.baViewersCount = 0;}
						}
				});
			} else {
				$(viewer).delay(300 + 300 * WPW.baViewersCount).animate({
					percent: 0
				}, {
					duration: main.cfg.animSpeed,
					step:function(){
						viewer.update();
						},
					easing: ease,
					complete:function(){viewer.update();}
				}).animate({
					percent: 1
				}, {
					duration: main.cfg.animSpeed,
					step:function(){
						viewer.update();
						},
					easing: ease,
					complete:function(){viewer.update();}
				}).animate({
					percent: main.cfg.startPercent
				}, {
					duration: main.cfg.animSpeed,
					step:function(){
						viewer.update();
						},
					easing: ease,
					complete:function(){viewer.update();
							WPW.baViewersCount -=1;
							if(WPW.baViewersCount < 0){WPW.baViewersCount = 0;}
						}
				});
			}
			
			main.cfg.disableIntro = true;
		}		
		
		viewer.resize = function(){
			if(!viewer.onScreen){return;}
			viewer.update();
			
			if(viewer.picA.pic && viewer.picA.isLoaded()){viewer.picA.resize();}
			if(viewer.picB.pic && viewer.picB.isLoaded()){viewer.picB.resize();}
		}		
		
		viewer.showA = function(){
			if(viewer.picA.isLoaded() && !viewer.picA.onScreen){
				viewer.picA.onScreen = 1;
				
				main.galleryNode.removeClass('wpw-ba-loading');
				viewer.node.append(viewer.picA.pic);
				viewer.picA.pic.fadeOut(0);
				viewer.picA.pic.fadeIn(300);
				viewer.picA.pic.addClass("wpw-ba-pic-a");
				viewer.picA.pic.addClass("wpw-ba-pic");
				if(viewer.onScreen){
					main.mainPic = viewer.picA;
				}
				main.animateHeight();
			}
		}
		
		viewer.showB = function(){
			if(viewer.picB.isLoaded() && !viewer.picB.onScreen){
				//ADD VIEWER INTERACTION BECAUSE SECOND IMAGE IS AVAILABLE
				
				viewer.picB.onScreen = 1;
				if(viewer.picB.none){
					return;
				}				
				viewer.door = $("<div class='wpw-ba-door'></div>");
				viewer.mask = $("<div class='wpw-ba-mask'></div>");
				viewer.picBox = $("<div class='wpw-ba-pic-box'></div>");
				viewer.wall = $("<div class='wpw-ba-wall'></div>");
				viewer.constroller = $('<div class="wpw-ba-controller"><div class="wpw-ba-controller-sign"></div></div>');
				viewer.node.append(viewer.door);
				viewer.door.append(viewer.mask);
				viewer.door.append(viewer.constroller);
				viewer.mask.append(viewer.picBox);
				viewer.picBox.append(viewer.picB.pic);
				viewer.picB.pic.addClass("wpw-ba-pic-b");
				viewer.picB.pic.addClass("wpw-ba-pic");

				viewer.node.append(viewer.wall);
				dragStuff = new WPW.DragStuff({
					theTrigger: viewer.wall,
					toDrag: viewer.door,
					toDragWidth: function(){return 1;},
					dragWidthLimit: function(){return main.galleryWidth;},
					toDragHeight: function(){return 0;},
					dragHeightLimit: function(){return 0;},
					onStart: function(){
						$(viewer).stop();
						viewer.update();
						clearTimeout(viewer.introAnimTimer);
					},
					onStop: function(){
						if(!dragStuff.inertiaAnim){
							main.galleryNode.removeClass("user-dragging");
						}
					},
					inertiaStop: function(){
						if(!dragStuff.inertiaAnim){
							main.galleryNode.removeClass("user-dragging");
						}
					},
					onDrag: function(){
						if(dragStuff.hasDrag()){
							if(!main.galleryNode.hasClass("user-dragging")){
								main.galleryNode.addClass("user-dragging");
							}
						}
						viewer.percent = dragStuff.percent;
						viewer.update(); 
					},
					innerDrag: true,
					hasInertia: true
				});	
				
				viewer.wall.click(function(e){
					$(viewer).stop();
					if(dragStuff.wasDragged){return false;}
					
					e.preventDefault();
					e.stopImmediatePropagation();
					e.stopPropagation();
					viewer.gotoPercent(e);
				})				
				
				viewer.introAnimTimer = setTimeout(function(){
					viewer.introAnim();
				}, 500);
				
			}
			viewer.update();
		}
	
		viewer.gotoPercent = function(e){
			if(!e){return false;}
			
			var pos;
			if(!e.pageX){
				pos = viewer.wall.data('dragEndX') - viewer.node.offset().left;
			} else{
				pos = e.pageX - viewer.node.offset().left;
			}
			if(!pos){return;}
			var targetPercent = pos/main.galleryWidth;
			var ease = "easeInOutExpo";
			$(viewer).stop().delay(200).animate({
				percent: targetPercent
			}, {
				duration: 600,
				step:function(){
					viewer.update();
					},
				easing: ease,
				complete:function(){
					viewer.percent = targetPercent;
					viewer.update();
				}
			});
			return false;
		}		
		
		viewer.loadPics = function(){
			if(!viewer.picA.pic){
				viewer.picA.pic = 1;
				viewer.picA = new imageObject(baNode.attr('data-src') || baNode.attr('src'));
				return false;
			}
					
			if(viewer.picB.pic && !viewer.picA.isLoaded()){return;}
			
			if(!viewer.picB.pic && !viewer.picB.none){
				viewer.picB.pic = 1;
				viewer.picB = new imageObject(baNode.attr('data-second') || baNode.attr('data-pic') || baNode.attr('data-alt') || baNode.attr('alt'));
				return false;
			}
			
			viewer.showA();
			viewer.showB();
			
			if(viewer.picA.isLoaded() && viewer.picB.isLoaded()){
				if(viewer.preloader){
					viewer.preloader.fadeOut(800, function(){
						viewer.preloader.remove();
						viewer.preloader = 0;
					});
				}
			}
			
			
			viewer.resize();
			return false;
		}
		
		viewer.preset = function(){
			if(viewer.isPreset){return false;}
			viewer.isPreset = 1;
			viewer.node = $('<div class="wpw-ba-box"></div>');
			viewer.preloader = $('<div class="wpw-ba-preloader"></div>');
			viewer.node.append(viewer.preloader);
			main.mover.append(viewer.node);
			if(baIndex){
				viewer.node.css('position', 'absolute');
				viewer.node.css('left', (baIndex * 100) + "%");
				viewer.node.css('top', 0);
			}
			return false;
		}
		
		viewer.show = function(){
			if(viewer.onScreen){return false;}
			viewer.onScreen = 1;
			main.mainPic = viewer.picA;
			viewer.preset();
			viewer.node.addClass("ba-selected-box");
			viewer.node.removeClass("ba-unselected-box");
			setTimeout(function(){
				viewer.loadPics();
				main.animateHeight();
			}, 100);
			
			main.updateTitle(baNode.attr("data-info") || baNode.attr("title"), baNode.attr("data-url"), baNode.attr("data-url-target"));
		}
		
		viewer.hide = function(){
			if(!viewer.onScreen){return false;}
			viewer.node.addClass("ba-unselected-box");
			viewer.node.removeClass("ba-selected-box");
			viewer.onScreen = 0;
		}
		
		var imageObject = function(picPath){
			var picObject = this;
			picObject.pic = $(new Image());
			
			picObject.isLoaded = function(){
				return (picObject.loaded || picObject.none);
			}
			
			if(!picPath && !picObject.none){
				picObject.loaded = true;
				picObject.none = true;
				setTimeout(function(){viewer.loadPics();}, 100);
			}
			
			picObject.pic.load(function(){
				picObject.loaded = 1;
				viewer.loadPics();
			}).error(function(){
				picObject.loaded = 1;
				alert("ERROR: Image not found at path: " + picPath);
				viewer.loadPics();
			}).attr("src", picPath);
			
			picObject.resize = function(){
				if(!picObject.loaded){return false;}
				
				var screenMargin = 10;
				
				picObject.pic.css("width", "");
				picObject.pic.css("height", "");
				picObject.pic.css("top", "");
				picObject.pic.css("left", "");
				
				if(main.lightbox.onScreen){
					if(picObject.pic.width() > WPW.cW - screenMargin){
						picObject.pic.css("width", WPW.cW - screenMargin);
						picObject.pic.css("height", "auto");
					}
					
					if(picObject.pic.height() > WPW.cH - screenMargin){
						picObject.pic.css("height", WPW.cH - screenMargin);
						picObject.pic.css("width", "auto");
					}
					
					picObject.pic.css("left", parseInt(WPW.cW/2 - picObject.pic.width()/2, 10));
					picObject.pic.css("top", parseInt(WPW.cH/2 - picObject.pic.height()/2, 10));
					
				}
			}
			
		}
		
		
		
		main.items.push(viewer);
	}
	
	//

	
	main.oldIndex = "none";
	main.gotoIndex = function(way){
		if(!way){way = 0;}
		
		main.currentIndex +=way;
		
		if(main.currentIndex >= main.nrItems){ main.currentIndex = 0; }
		if(main.currentIndex < 0){ main.currentIndex = main.nrItems - 1; }
		
		if(main.oldIndex === main.currentIndex){
			return false;
		}
		
		main.startHeight = main.galleryNode.height();
		
		if(main.items[main.currentIndex]){
			main.items[main.currentIndex].show();
		}
		
		if(main.items[main.oldIndex]){
			main.items[main.oldIndex].hide();
		}
		
		
		$(main).stop().animate({
			containerPosition: -main.currentIndex * 100
		}, {
			duration: 600,
			easing: ease,
			step: function(){
				main.mover.css('left', main.containerPosition + "%");
			},
			complete: function(){
				main.mover.css('left', main.containerPosition + "%");
				main.galleryNode.trigger("ItemChanged");
			}
		});
		
		main.galleryNode.trigger("ItemChange");
		
		try {
			//
		} catch(e) {}
		
		main.oldIndex = main.currentIndex;
		
		return false;
	}
	
	main.imageNodes.each(function(baIndex){
		var ba = new baViewer($(this), baIndex);
	});
	
	
	var sizeTimer = 0;
	
	main.setSize = function(){
		clearTimeout(sizeTimer);
		if(main.onlyLightbox && !main.lightbox.onScreen){return;}
		if(main.galleryNode.width() < 200){
			sizeTimer = setTimeout(function(){
				main.setSize();
			}, 500);
			return false;
		}		
		
		main.galleryNode.css('max-width', "");
		main.galleryNode.css('max-height', "");		
		
		if(main.lightbox.onScreen){
			main.galleryNode.css('width', "100%");
			main.galleryNode.css('height', "100%");
			main.galleryWidth = WPW.cW;
			main.galleryHeight = WPW.cH;
			
		} else {
			main.galleryNode.css('width', "");
			main.galleryNode.css('height', "");
			
			if(main.cfg.width){
				main.galleryNode.css('width', main.cfg.width);
			}
			
			if(main.cfg.maxWidth){
				main.galleryNode.css('max-width', main.cfg.maxWidth);
			}
			
			if(main.cfg.maxHeight){
				main.galleryNode.css('max-height', main.cfg.maxHeight);
			}
			
			if(main.cfg.height){
				main.galleryNode.css('height', main.cfg.height);
			}

			main.galleryWidth = main.galleryNode.width();
			main.galleryHeight = main.galleryNode.height();			
		}
		
		var i = 0;
		
		for(i = 0; i < main.nrItems; i++){
			main.items[i].resize();
		}
		
		main.animateHeight();
	}
	 
	main.preset = function(){
		if(main.isPreset){return false;}
		main.isPreset = 1;
		
		
		//read default size 
		if(main.cfg.width === "0" || main.cfg.width === 0 || !main.cfg.width || main.cfg.width === "auto"){
			main.cfg.width = false;
		}
		if(main.cfg.height === "0" || main.cfg.height === 0 || !main.cfg.height || main.cfg.height === "auto"){
			main.cfg.height = false;
		}
		
		//
		if(main.nrItems > 1){
			main.footer = $("<div class='wpw-ba-footer'></div>");
			if(!main.cfg.hideTitles){
				main.info = $("<div class='wpw-ba-info'><div class='wpw-ba-info-bg'></div><div class='wpw-ba-info-text'>DEMO Title!</div></div>");	
			}
			

			main.galleryNode.append(main.footer);
			main.footer.append(main.info);
			
			main.btnNext = $("<div class='wpw-ba-next'></div>");
			main.btnPrev = $("<div class='wpw-ba-prev'></div>");
			
			main.footer.append(main.btnNext);
			main.footer.append(main.btnPrev);
			
			main.btnNext.click(function(e){ e.preventDefault(); main.gotoIndex(1); return false;});
			main.btnPrev.click(function(e){ e.preventDefault(); main.gotoIndex(-1); return false;});
		}
		
		//
		
		$('body').bind('WindowResized', main.setSize);
		
		main.galleryNode.append(main.mover);
		main.gotoIndex();
		main.setSize();
		return false;
	}	 

	//VIEWER TYPE
	if(main.galleryNode.attr('data-lightbox')){
		main.btnZoom = $('<div class="wpw-ba-btn-zoom"></div>');
		main.galleryNode.append(main.btnZoom);
		
		main.btnZoom.click(function(){
			main.lightbox.toggle();
		});		
		
		if(main.galleryNode.attr('data-lightbox') === "default+lightbox" || main.galleryNode.attr('data-lightbox') === "simple+lightbox"){
			//USE ONLY ZOOM BUTTON
		} else {
			//CHECK FOR OTHER BUTTON TYPES
			var buttonType = main.galleryNode.attr('data-lightbox');
			main.onlyLightbox = 1;
			//check inside button
			var lb = $('.lightbox-button', main.galleryNode);
			//check inside viewer node for a button with users query 
			if(!lb.length){
				try {
					lb = $(buttonType, main.galleryNode);
				} catch(e) { lb = ""; }
			} else {
				//add outside if button is inside
				main.galleryNode.before(lb);
			}
			//check global for a button with users query 
			if(!lb.length){
				try {
				lb = $(buttonType);
				} catch(e) { lb = ""; }
			} else {
				
			}
			
			//create and use as text button
			if(!lb.length){
				main.btnZoom = $('<div class="wpw-ba-btn-open"></div>');
				lb = main.btnZoom.html(buttonType);
				main.galleryNode.before(main.btnZoom);
			} else {
				main.btnZoom = lb;
			}

			main.placeHolder = main.btnZoom;
			main.galleryNode.detach();
		}
		
		main.btnZoom.unbind();
		
		main.btnZoom.each(function(){
			var bZoom = $(this);
			bZoom.click(function(){
				var index = bZoom.attr('href') || bZoom.attr('data-index');
				main.preset();
				if(index){
					var index = parseInt(index.replace("#",""), 10) - 1;
					main.currentIndex = index;
					main.lightbox.toggle(1);	
				} else {
					main.lightbox.toggle();
				}
				
				return false;
			});
			
		});
	}

	if(!main.onlyLightbox){
		//preset only viewers that have default blocks
		main.preset();	
	}
	
	
	//GALLERY END
}

$.fn.wpwBAgallery = function(options) {
    return this.each(function(){
        var element = $(this);
        // Return early if this element already has a plugin instance
        if (element.data('wpwbagallery')) {
        	return;
        }
        // Pass options to plugin constructor
        var wpwbagallery = new wpwBAgallery(this, options);
        // Store plugin object in this element's data
        element.data('wpwbagallery', wpwbagallery);
    });
};

//Default settings
$.fn.wpwBAgallery.defaults = {
	width:"auto",
	height:"auto",
	animSpeed: 900,
	maxWidth: 0,
	maxHeight: 0,
	hideTitles: false,
	startPercent: 0.5,
	disableIntro:false,
	lightbox: 0,
	theme:"ba-default"
};

$.fn._reverse = [].reverse;

$(document).ready(function($){
	jQuery(".wpw-auto-init-ba").wpwBAgallery();
	WPW.ResizeEngine();
});		
	
	
//ENCAPSULATION END	
})(jQuery);
	
	
/**
 * 
 * 		title:		Resize Engine
 */	
	
WPW.localResizeEngine = function(){
	var main = this;
	var $ = jQuery;
	main.resizeTimer = 0;
	
	if(WPW.ResizeEngineStarter){ return; };
	WPW.ResizeEngineStarter = true;
	main.resizeEvent = function(){
		clearInterval(main.resizeTimer);
		main.resizeTimer = setInterval(function(){
			if(!WPW.body){
				if($('body').length){WPW.body = $('body');}
			}
			
			WPW.cW = $(window).width();
			WPW.cH = $(window).height();
			
			WPW.body.trigger('WindowResized');
			clearInterval(main.resizeTimer);
		}, 100);
	}
	
	main.resizeEvent();
	$(window).resize(function() { main.resizeEvent(); });		
}

WPW.ResizeEngine = WPW.ResizeEngine || WPW.localResizeEngine;

/**
 * 
 * 		title:		DRAG STUFF - jQuery plugin
 * 
 *		author: 	Ovidiu Stefancu
 *					http:www.wpworks.net
 * 		info:		Custom function by wpworks.net 
 * 
 * 		ver:		1.3
 */

var WPWmodule = {
	id : "DragStuff", 
	version : 1.3, 
	//cfg.theTrigger, cfg.toDrag, cfg.toDragWidth, cfg.dragWidthLimit, cfg.toDragHeight, cfg.dragHeightLimit, cfg.innerDrag, cfg.hasInertia
	func : function(cfg){
		
		if(cfg.theTrigger.data('DragStuff')){
			cfg.theTrigger.data('DragStuff').reset();
			return cfg.theTrigger.data('DragStuff');
		}
	
		var $ = jQuery;
		var main = this;
		main.inertiaX = 0;
		main.inertiaY = 0;

		var inertiaInterval = 0;
		var inertiaSpeed = 30;		
		
		var handlerPositionX = 0;
		var handlerPositionY = 0;
		var oldMx = 0;
		var oldMy = 0;
		var mX = 0;
		var mY = 0;
		
		WPW.body = WPW.body || $('body');
		
		function isTouchDevice() {
			if('msMaxTouchPoints' in window.navigator && window.navigator.msMaxTouchPoints === 0){return false;}
		  return !!(window.navigator.msMaxTouchPoints) || !!('ontouchstart' in window) || !!('onmsgesturechange' in window);
		};
					
		
		var dragDistance = 0;
		var dragDistanceV = 0;
		
		var dragOn = false;
		
		main.percent = 0;
	
		main.iX = 0;
		main.iY = 0;
		main.inertiaCalcTimer = 0;
		main.calculateInertia = function(){
			if(Math.abs(main.inertiaX) > Math.abs(main.iX)){
				main.iX = main.inertiaX * 2;
			} else {
				main.iX = main.iX * 0.6;
			}
			
			if(Math.abs(main.inertiaY) > Math.abs(main.iY)){
				main.iY = main.inertiaY * 2;
			} else {
				main.iY = main.iY * 0.6;
			}
		}
	
		//handles the mouse drag&rotate events
		var touchEventsPreset = function(){
			cfg.theTrigger.bind("touchstart", function(e){
				//e.preventDefault();
	  			var touchStart = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				
				oldMx = touchStart.pageX;
				oldMy = touchStart.pageY;
				dragOn = true;
				
				handlerPositionX = cfg.toDrag.position().left;
				handlerPositionY = cfg.toDrag.position().top;			
				
				dragStart();
	
				//return false;
			});
			
			WPW.body.bind("touchmove", function(e){
				if(!cfg.toDrag.data('dragging')){return;}
				
				
	  			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
				mX = -oldMx + touch.pageX;
				mY = -oldMy + touch.pageY;
				
				main.inertiaX = mX; 
				main.inertiaY = mY; 				
				
				oldMx = touch.pageX;
				oldMy = touch.pageY;
	
				handlerPositionX = handlerPositionX + mX;
				handlerPositionY = handlerPositionY + mY;
				dragDistance += Math.abs(mX);
				dragDistanceV += Math.abs(mY);
				
				testPosition();
				if(dragDistance - dragDistanceV > 20){
					e.preventDefault();
					return false;
				}
			});	
			
			var touchEnd = function(e){
				if(!cfg.toDrag.data('dragging')){return;}
				
				dragEnd(e);
			}
			
			WPW.body.bind("touchend", function(e){ touchEnd(e); });
			WPW.body.bind("touchcancel", function(e){ touchEnd(e); });
	
			cfg.theTrigger.bind("touchend", function(e){ touchEnd(e); });
			cfg.theTrigger.bind("touchcancel", function(e){ touchEnd(e); });
		};
		
		main.mouseUp = function(e){
			cfg.theTrigger.unbind('mouseup', main.mouseUp);
			cfg.theTrigger.unbind('mousemove', main.mouseMove);
			WPW.body.unbind('mouseup', main.mouseUp);
			WPW.body.unbind('mousemove', main.mouseMove);
			
			dragEnd();
			return false;			
		}
		
		main.mouseMove = function(e){
			mX = -oldMx + e.pageX;
			mY = -oldMy + e.pageY;
			
			main.inertiaX = mX; 
			main.inertiaY = mY; 
			
			oldMx = e.pageX;
			oldMy = e.pageY;
			
			handlerPositionX = handlerPositionX + mX;
			handlerPositionY = handlerPositionY + mY;
			dragDistance += Math.abs(mX);
			dragDistanceV += Math.abs(mY);
			
			testPosition();
			if(!isTouchDevice()){
				return false;
			}
		}
		
		main.mouseDown = function(e){
			oldMx = e.pageX;
			oldMy = e.pageY;
			dragOn = true;
			dragStart();
			
			handlerPositionX = cfg.toDrag.position().left;
			handlerPositionY = cfg.toDrag.position().top;		
			
			WPW.body.mousemove(main.mouseMove);
			
			$('html, body').mouseup(main.mouseUp);
			cfg.theTrigger.mouseup(main.mouseUp);
			return false;
		}
		
		if(!isTouchDevice()){
			cfg.theTrigger.mousedown(main.mouseDown);
		}	
		
		var moveDragger = function(){
			if(cfg.toDrag.hasClass('fixed-mover')){return;}
			
			if(cfg.toDragWidth() > cfg.dragWidthLimit() || cfg.innerDrag){
				if(cfg.dragWidthLimit())cfg.toDrag.css('left', handlerPositionX);	
			}
	
			if(cfg.dragHeightLimit()){
				cfg.toDrag.css('top', handlerPositionY);
			}
	
			main.percent = handlerPositionX/(cfg.dragWidthLimit() - cfg.toDragWidth());
			if(cfg.onDrag){cfg.onDrag();}
		} 
		
		main.manualRefresh = function(){
			handlerPositionX = cfg.toDrag.position().left;
			handlerPositionY = cfg.toDrag.position().top;
			testPosition();
		}
		
		var testPosition = function(){
			var testResult = {};
			if(cfg.innerDrag){
				if(handlerPositionX < 0) {
					handlerPositionX = 0;
					testResult.maxLeft = true;
				}
				if(handlerPositionY < 0) {
					handlerPositionY = 0;
					testResult.maxTop = true;
				}
				if(handlerPositionX > cfg.dragWidthLimit() - cfg.toDragWidth()){
					testResult.maxRight = true;
					handlerPositionX = cfg.dragWidthLimit() - cfg.toDragWidth();
					}
				if(handlerPositionY > cfg.dragHeightLimit() - cfg.toDragHeight()){
					handlerPositionY = cfg.dragHeightLimit() - cfg.toDragHeight();
					testResult.maxBottom = true;
					}
			} else {
				if(handlerPositionX < cfg.dragWidthLimit() - cfg.toDragWidth()) {
					handlerPositionX = cfg.dragWidthLimit() - cfg.toDragWidth()
					testResult.maxLeft = true;
					}
				if(handlerPositionY < cfg.dragHeightLimit() - cfg.toDragHeight()) {
					handlerPositionY = cfg.dragHeightLimit() - cfg.toDragHeight();
					testResult.maxTop = true;
				}
				if(handlerPositionX > 0){
					handlerPositionX = 0;
					testResult.maxRight = true;
				}
				if(handlerPositionY > 0){
					handlerPositionY = 0;
					testResult.maxTop = true;
				}				
			}
			main.calculateInertia();
			moveDragger();
			return testResult;
		}
		
		var dragStart = function(){
			cfg.toDrag.data('dragging', true);
			if(cfg.onStart){
				cfg.onStart();
			}
			main.wasDragged = false;
			
			main.onDrag = 1;
			
			dragDistance = 0;
			dragDistanceV = 0;
			WPW.dragContainerMoved = false;
		
			main.iX = 0;
			main.iY = 0;	
			main.inertiaX = 0;
			main.inertiaY = 0;	
	
			clearTimeout(inertiaInterval);
			clearInterval(main.inertiaCalcTimer);
			main.inertiaCalcTimer = setInterval(main.calculateInertia, 300);
	
			cfg.theTrigger.trigger('wpwDragStart');
		}
		
		main.hasDrag = function(){
			if(dragDistance > 10 || dragDistanceV > 10){
				main.wasDragged = true;
			}
			return main.wasDragged;	
		}		
		
		var dragEnd = function(e){
			cfg.toDrag.data('dragging', false);
			main.hasDrag();
			if(isTouchDevice()){
				var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			
				var endX = touch.pageX;
				var endY = touch.pageY;
				
				cfg.theTrigger.data("dragEndX", endX);
				cfg.theTrigger.data("dragEndY", endY);
			}

			setTimeout(function(){main.wasDragged = false}, 100);
			dragDistance = 0;
			dragDistanceV = 0;
			cfg.theTrigger.trigger('wpwDragEnd');
			
			main.inertiaX = main.iX;
			main.inertiaY = main.iY;
			
			if(cfg.hasInertia){
				main.doInertia();
			}
			if(cfg.onStop){
				cfg.onStop();
			}
			
			main.onDrag = 0; 
			
			clearInterval(main.inertiaCalcTimer);
			
		}

		main.inertiaStep = function(){
			main.inertiaX = WPW.smoothMove(main.inertiaX, 0, 15);
				handlerPositionX += main.inertiaX;
				var testResult = testPosition();
				if(testResult.maxLeft || testResult.maxRight){
					main.inertiaX = main.inertiaX * -1 * 0.5;
				}
				clearTimeout(inertiaInterval);
				if(Math.abs(main.inertiaX) < 1){
					main.inertiaX = 0;
					main.inertiaAnim = 0;
					if(cfg.inertiaStop){
						cfg.inertiaStop();
					}					
				} else {
					inertiaInterval = setTimeout(function(){
						clearTimeout(inertiaInterval);
						main.inertiaStep();
					}, inertiaSpeed);
				}
		}
		

		
		main.doInertia = function(){
			if(Math.abs(main.inertiaX) > 2){
				inertiaInterval = setTimeout(function(){
					main.inertiaStep();
				}, inertiaSpeed);
				main.inertiaAnim = 1;
			} else {
				main.inertiaAnim = 0;
				if(cfg.inertiaStop){
					cfg.inertiaStop();
				}
			}
		}
		main.reset = function(){
			cfg.theTrigger.bind("RefreshDragger", function(){
				main.manualRefresh();
			});
			
			main.inertiaX = 0;
			main.inertiaY = 0;				
			
			if(isTouchDevice()){
				touchEventsPreset();
			}
		}
		main.reset();
		cfg.theTrigger.data('DragStuff', this);
		
		return this; 
		
		//
	    }
	} 

if(!WPW[WPWmodule.id+"V"] || WPW[WPWmodule.id+"V"] < WPWmodule.version) {
	WPW[WPWmodule.id] = WPWmodule.func;
	WPW[WPWmodule.id+"V"] = WPWmodule.version;
} 

WPW.smoothMove = function(curr, tar, spd){
	var d = curr+(tar-curr)/spd;
	return d;
}



