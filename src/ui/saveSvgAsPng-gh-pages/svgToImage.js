/*
    svg切分成多个图片进行导出
*/

// 构造 svg Url，此处省略将 svg 经字符过滤后转为 url 的过程。
var svgUrl = DomURL.createObjectURL(blob);
var svgWidth = document.querySelector('#kity_svg').getAttribute('width');
var svgHeight = document.querySelector('#kity_svg').getAttribute('height');

// 分片的宽度和高度，可根据浏览器做适配
var w0 = 8192;
var h0 = 8192;

// 每行和每列能容纳的分片数
var M = Math.ceil(svgWidth / w0);
var N = Math.ceil(svgHeight / h0);

var idx = 0;
loadImage(svgUrl).then(function (img) {

    while (idx < M * N) {
        // 要分割的面片在 image 上的坐标和尺寸
        var targetX = idx % M * w0,
            targetY = idx / M * h0,
            targetW = (idx + 1) % M ? w0 : (svgWidth - (M - 1) * w0),
            targetH = idx >= (N - 1) * M ? (svgHeight - (N - 1) * h0) : h0;

        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        canvas.width = targetW;
        canvas.height = targetH;

        ctx.drawImage(img, targetX, targetY, targetW, targetH, 0, 0, targetW, targetH);

        console.log('now it is ' + idx);

        // 准备在前端下载
        var a = document.createElement('a');
        a.download = 'naotu-' + idx + '.png';
        a.href = canvas.toDataURL('image/png');

        var clickEvent = new MouseEvent('click', {
            'view': window,
            'bubbles': true,
            'cancelable': false
        });

        a.dispatchEvent(clickEvent);

        idx++;
    }

}, function (err) {
    console.log(err);
});

// 加载 image
function loadImage(url) {
    return new Promise(function (resolve, reject) {
        var image = new Image();

        image.src = url;
        image.crossOrigin = 'Anonymous';
        image.onload = function () {
            resolve(this);
        };

        image.onerror = function (err) {
            reject(err);
        };
    });
}

var embededImages = document.querySelectorAll('#kity_svg image');
// 由 nodeList 转为 array
embededImages = Array.prototype.slice.call(embededImages);
// 加载底层的图
loadImage(svgUrl).then(function(img) {

    var canvas = document.createElement('canvas'),
    ctx = canvas.getContext("2d");

    canvas.width = svgWidth;
    canvas.height = svgHeight;

    ctx.drawImage(img, 0, 0);
    // 遍历 svg 里面所有的 image 元素
    embededImages.reduce(function(sequence, svgImg){

        return sequence.then(function() {
            var url = svgImg.getAttribute('xlink:href') + 'abc',
                dX = svgImg.getAttribute('x'),
                dY = svgImg.getAttribute('y'),
                dWidth = svgImg.getAttribute('width'),
                dHeight = svgImg.getAttribute('height');

            return loadImage(url).then(function(sImg) {
                ctx.drawImage(sImg, 0, 0, sImg.width, sImg.height, dX, dY, dWidth, dHeight);
            }, function(err) {
                console.log(err);
            });
        }, function(err) {
            console.log(err);
        });
    }, Promise.resolve()).then(function() {
        // 准备在前端下载
        var a = document.createElement("a");
        a.download = 'download.png';
        a.href = canvas.toDataURL("image/png");

        var clickEvent = new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": false
        });

        a.dispatchEvent(clickEvent);

    });

}, function(err) {
    console.log(err);
})



