var http = require("http");//网络请求
var fs = require("fs");//文件系统，操作文件
var cheerio = require("cheerio"),//类jquery操作获取的html
    async=require('async'),//控制多页面的并发量
    express=require('express');

var app=express();

//url 就是你想要爬的网页
var url = "http://www.baidu.com";

//需要爬的网址
function getUrls(){
    var urls=[]
        ,baseUrl='http://acm.hdu.edu.cn/statistic.php?pid=';//基础网址

    for(var i=1000;i<1100;i++){//页面中id
        var tmp=baseUrl+i;
        urls.push(tmp);
    }

    return urls;
}

var url_id=0;

//获取页面内容
function download ( url,callback ) {
    http.get(url,function(res){
        var data = "";
        url_id++;
        res.on("data",function(chunk){
            data += chunk;
            //获取html页面
            fs.writeFile(__dirname + "/downWebsite/"+url_id+".html",data,function(err){
                if(err){
                    console.log(err);
                }
            })
        });
        res.on("end",function(){
            callback(data)
        })
    }).on("error",function(err){
        if(err){
            console.log(err);
        }
    })
}

//获取图片
download(url, function (data) {
    if (data) {
        var $ = cheerio.load(data);
        // 页面中直接放置在body img标签中图片
        $("img").each(function (i, elem) {
            var imgSrc = $(this).attr("src");
            if (imgSrc.indexOf('http:') < 0) {
                imgSrc = "http:" + imgSrc;
                downPic(imgSrc);
            } else {
                downPic(imgSrc);
            }
        });
        // 页面中放置在style 中url上的图片
        var urlImgs = [];
        var urlImgData = data;
        var index = 1;
        while (index > 0) {
            urlImgData = urlImgData.slice(urlImgData.indexOf('url('));
            var endNum = parseInt(urlImgData.indexOf(')'));
            getHtmlImg(urlImgData, endNum);

            function getHtmlImg(urlImgData, endNum) {
                var urlImg = urlImgData.slice(4, parseInt(endNum - 1));
                if (urlImg.indexOf('.png') > 0 || urlImg.indexOf('.jpg') > 0 || urlImg.indexOf('.gif') > 0) {
                    urlImgs.push(urlImg);
                }
                urlImgData = urlImgData.slice(4, urlImgData.indexOf('url('));
                index = urlImgData.indexOf('url(');
            }
        }
        if (urlImgs.length > 0) {
            urlImgs.each(function (i, elem) {
                downPic(elem);
            });
        }

        function downPic(imgSrc) {
            var reg = /[^\/\\]+$/g;
            var libName = imgSrc.match(reg).join('');
            var libFilter = libName.slice(0, libName.indexOf('.'));
            http.get(imgSrc, function (res) {
                var imgData = "";
                res.setEncoding("binary");
                res.on("data", function (chunk) {
                    imgData += chunk;
                });
                res.on("end", function () {
                    if (!fs.existsSync("./downWebsite/imgs")) {
                        fs.mkdirSync("./downWebsite/imgs");
                    }
                    var imgPath = "/" + libFilter + "." + imgSrc.split(".").pop();
                    fs.writeFile(__dirname + "/downWebsite/imgs" + imgPath, imgData, "binary", function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                })
            })
        }
    }
});
//获取js文件
download(url, function (data) {
    if (data) {
        var $ = cheerio.load(data);
        var scriptFile = $('script').toArray();
        scriptFile.forEach(function (val, index) {
            //js中直接写在html文件中部分不予理会
            if (val.attribs.src != null) {
                obtainLibName(val.attribs.src, index);
            }
        });

        function obtainLibName(jsLink, i) {
            var reg = /[^\/\\]+$/g;
            var libName = jsLink.match(reg).join('');
            var libFilter = libName.slice(0, libName.indexOf('.'));
            if (!fs.existsSync("./downWebsite/js")) {
                fs.mkdirSync("./downWebsite/js");
            }
            http.get(jsLink, function (response) {
                response.setEncoding('binary');  //二进制binary
                var dataJs = '';
                response.on('data', function (datajs) {    //加载到内存
                    dataJs += datajs;
                }).on('end', function () {          //加载完
                    fs.writeFile(__dirname + "/downWebsite/js/" + libFilter + ".js", dataJs, "binary", function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                })
            })
        }
    }
});
//获取css文件
download(url, function (data) {
    if (data) {
        var $ = cheerio.load(data);
        var linkFile = $('link').toArray();
        linkFile.forEach(function (val, index) {
            //link中没有href的部分
            if (val.attribs.href != null) {
                if ((val.attribs.href).indexOf(".css") > 0) {
                    obtainLibName(val.attribs.href, index);
                }
            }
        });

        function obtainLibName(jsLink, i) {
            var reg = /[^\/\\]+$/g;
            var libName = jsLink.match(reg).join('');
            var libFilter = libName.slice(0, parseInt(libName.indexOf('.css') + 1));
            if (!fs.existsSync("./downWebsite/css")) {
                fs.mkdirSync("./downWebsite/css");
            }
            http.get(jsLink, function (response) {
                response.setEncoding('binary');  //二进制binary
                var dataCss = '';
                response.on('data', function (datacss) {    //加载到内存
                    dataCss += datacss;
                }).on('end', function () {          //加载完
                    fs.writeFile(__dirname + "/downWebsite/css/" + libFilter + ".css", dataCss, "binary", function (err) {
                        if (err) {
                            console.log(err);
                        }
                    })
                })
            })
        }
    }
});

//listen
app.listen(3000,function(){
    console.log('app is listening at port 3000.');
});


