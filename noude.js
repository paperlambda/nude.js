(function(){
    Array.prototype.remove = function(index){
        var rest = this.slice(index +1);
        this.length = index;
        return this.push.apply(this, rest);
    };

    var nude = (function(){
        var canvas = null,
        ctx = null,
        skinRegions = [],
        resultFn = null,
        img = null,

        initCanvas = function(){
            canvas = document.createElement("canvas");
            
            // Initiate canvas
            // canvas.style.display = 'none';
            var body = document.getElementsByTagName("body")[0];
            body.append(canvas);
            ctx = canvas.getContext("2d");
        },

        loadImageById = function(id){
            // Get image
            var img = document.getElementById(id);

            // Set width and height of canvas from image's
            canvas.width = img.width;
            canvas.height = img.height;

            // Return the result function
            resultFn = null;

            // Draw the image into the canvas element
            ctx.drawImage(img, 0, 0);

            // onHoverCheckSkin()
        },

        scanImage = function(){
            // Get image data
            var image = ctx.getImageData(0,0,canvas.width, canvas.height),
            imageData = image.data,
            skinMap = [],
            detectedRegions = [],
            mergeRegions = [],
            width = canvas.width,
            lastFrom = -1,
            lastTo = -1;

            var addMerge = function(from, to){
                lastFrom = from;
                lastTo = to;
                var len = mergeRegions.length,
                    fromIndex = -1,
                    toIndex = -1;

                while(len--){
                    var region = mergeRegions[len],
                        rlen = region.length;

                    while(rlen--){
                        if(region[rlen] == from){
                            fromIndex = len;
                        }

                        if(region[rlen] == to){
                            toIndex = len;
                        }
                    }
                }

                if(fromIndex != -1 && toIndex != -1 && fromIndex == toIndex){
                    return;
                }

                if(fromIndex == -1 && toIndex == -1){
                    mergeRegions.push([from,to])

                    return;
                }

                if(fromIndex != -1 && toIndex == -1){
                    mergeRegions[fromIndex].push(to)
                }

                if(fromIndex == -1 && toIndex != -1){
                    mergeRegions[toIndex].push(from)
                    return;
                }

                if(fromIndex != -1 && toIndex != -1 && fromIndex != toIndex){
                    mergeRegions[fromIndex] = mergeRegions[fromIndex].concat(mergeRegions[toIndex]);
                    mergeRegions.remove(toIndex);
                    return;
                }
            }
            var length = imageData.length,
                width = canvas.width;

            for(var i =0, u = 1; i < length; i+=4, u++){
                var r = imageData[i],
                    g = imageData[i+1],
                    b = imageData[i+2],
                    x = (u>width)?((u%width)-1):u,
                    y = (u>width)?(Math.ceil(u/width)-1):1;

                    if(classsifySkin(r,g,b)){
                        skinMap.push({"id": u, "skin": true, "region": 0, "x": x, "y": y, "checked":false})
                        
                        var region = -1,
                        checkIndexes = [u-2, (u-width)-2, u-width-1, (u-width)],
                        checker =false;

                        for(var o = 0; o < 4; o++){
                            var index = checkIndexes[o];
                            if(skinMap[index] && skinMap[index].skin){
                                if(skinMap[index].region!=region && region!=-1 && lastFrom!=region && lastTo!=skinMap[index].region){
                                    addMerge(region, skinMap[index].region);
                                }
                                region = skinMap[index].region;
                                checker = true;
                            }
                        }

                        if(!checker){
                            skinMap[u-1].region = detectedRegions.length;
                            detectedRegions.push([skinMap[u-1]]);
                            continue;
                        }else{
                            
                            if(region > -1){
                                
                                if(!detectedRegions[region]){
                                    detectedRegions[region] = [];
                                }
            
                                skinMap[u-1].region = region;					
                                detectedRegions[region].push(skinMap[u-1]);
    
                            }
                        }
                    }else{
                        skinMap.push({"id": u, "skin": false, "region": 0, "x": x, "y": y, "checked": false});
                    }
            }
            mergeRegions(detectedRegions, mergeRegions);
            console.log(skinMap)
        };

        classsifySkin = function(r,g,b){
            // Pixel-based skin color detection techniques

            var rgbClassifier = ((r>95) && (g>40 && g <100) && (b>20) && ((Math.max(r,g,b) - Math.min(r,g,b)) > 15) && (Math.abs(r-g)>15) && (r > g) && (r > b)),
			nurgb = toNormalizedRgb(r, g, b),
			nr = nurgb[0],
			ng = nurgb[1],
			nb = nurgb[2],
			normRgbClassifier = (((nr/ng)>1.185) && (((r*b)/(Math.pow(r+g+b,2))) > 0.107) && (((r*g)/(Math.pow(r+g+b,2))) > 0.112)),
			hsv = toHsvTest(r, g, b),
			h = hsv[0],
			s = hsv[1],
            hsvClassifier = (h > 0 && h < 35 && s > 0.23 && s < 0.68);

            return (rgbClassifier || normRgbClassifier || hsvClassifier);
        
        },

        onHoverCheckSkin = function(){
            function check(event){
                var pixel = ctx.getImageData(event.layerX, event.layerY, 1,1);
                var r = pixel.data[0],
                    g = pixel.data[1],
                    b = pixel.data[2];
                console.log(classsifySkin(r,g,b))
                return classsifySkin(r,g,b)
            }
            canvas.addEventListener('mousemove', check)
        },


		toHsvTest = function(r, g, b){
			var h = 0,
			mx = Math.max(r, g, b),
			mn = Math.min(r, g, b),
			dif = mx - mn;
			
			if(mx == r){
				h = (g - b)/dif;
			}else if(mx == g){
				h = 2+((g - r)/dif)
			}else{
				h = 4+((r - g)/dif);
			}
			h = h*60;
			if(h < 0){
				h = h+360;
			}
			
			return [h, 1-(3*((Math.min(r,g,b))/(r+g+b))),(1/3)*(r+g+b)] ;	
			
		},

        toNormalizedRgb = function(r,g,b){
            var sum = r+g+b;
            return [(r/sum), (g/sum), (b/sum)];
        }

        return {
            init: function(){
                initCanvas();
            },
            load: function(param){
                loadImageById(param)
            },
			scan: function(fn){
				if(arguments.length>0 && typeof(arguments[0]) == "function"){
					resultFn = fn;
				}
				scanImage();
			}
        };
    })();
    window.nude = nude;
    nude.init();
})();