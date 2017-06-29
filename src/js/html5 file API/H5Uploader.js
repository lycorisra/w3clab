; (function (window, $) {
    var defaults = {
        fileInput: null,				    //html file控件
        dragDrop: null,					    //拖拽敏感区域
        btnUpload: null,					//提交按钮
        url: '',						    //ajax地址
        blob: false,                        //是否是大文件，默认为否，大文件上传需要分段读取和上传

        onSelect: function () { },		    //文件选择后
        onDelete: function () { },		    //文件删除后
        onDragOver: function () { },		//文件拖拽到敏感区域时
        onDragLeave: function () { },	    //文件离开到敏感区域时
        onProgress: function () { },		//文件上传进度
        onSuccess: function () { },		    //文件上传成功时
        onFailure: function () { },		    //文件上传失败时,
        onComplete: function () { },		//文件全部上传完毕时
    };
    var H5Uploader = function (options) {
        options = $.extend({}, defaults, options);

        this.uploadForm = options.uploadForm;
        this.fileInput = options.fileInput;
        this.dragDrop = options.dragDrop;
        this.btnUpload = options.btnUpload;
        this.url = options.url;
        this.blob = options.blob;

        this.onSelect = options.onSelect;
        this.onDragOver = options.onDragOver;
        this.onProgress = options.onProgress;
        this.onComplete = options.onComplete;

        this._uploader = new Uploader(this);
        this.init();
    };

    function Uploader(instance) {
        this.uploader = instance;
    }
    Uploader.prototype = {
        dragHover: function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(e.target).addClass('upload_drag_hover');
            return this;
        },
        dragLeave: function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(e.target).addClass('upload_drag_hover');
            return this;
        },
        getFiles: function (fileInput, dragInput) {
            // 取消鼠标经过样式
            //this.dragHover(e);

            var files = [];
            fileInput && files.push(fileInput.files);
            dragInput && files.push(dragInput.dataTransfer.files);

            this.dealFiles(files);
            return files;
        },
        dealFiles: function (files) {
            for (var i = 0, file; file = files[i]; i++) {
                file.index = i;
            }
        },
        delFile: function (file, files, onDelete) {
            for (var i = 0; i < files.length; i++) {
                if (file == files[i]) {
                    files.slice(i, 0);  // 从文件列表中删除该文件 
                    onDelete && onDelete(file);
                    break;
                }
            }
        },
        upload: function () {
            var self = this,
                url = self.uploader.url,
                formId = 'H5UploadForm',
                target = 'iframe_result',
                form = self.uploader.uploadForm,
                iframe = document.getElementById(target);

            if (!form) {
                form = document.createElement('form');

                form.style.display = 'none';
                form.id = formId;
                form.action = url;
                form.method = 'POST';
                form.encoding = 'multipart/form-data';
                //form.enctype && (form.enctype = 'multipart/form-data');

                var copy = self.uploader.fileInput.cloneNode(false);
                copy.id = 'clone_fileinput';
                form.appendChild(copy);

                document.body.appendChild(form);
            }
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.id = target;
                iframe.name = target;
                document.body.appendChild(iframe);
            }
            form.target = target;

            iframe.onload = function () {
                self.afterUpload(this);

                //document.body.removeChild();
            };
            if (self.uploader.blob) {
                self.readLargeFile(self.uploader.fileInput.files[0]);
            }
            else {
                $(form).submit();
            }
        },
        afterUpload: function (iframe) {
            var content = iframe.contentWindow.document || iframe.contentDocument.document,
                responseText = content.body.innerHTML;

            this.uploader.onComplete(responseText);
        },
        readLargeFile: function (file) {
            var self = this,
                reader = new FileReader(),
                fileSize = file.size,
                loaded = 0,
                block = 2 * 1024 * 1024; // 每次读取1M大小

            var readblob = function () {
                var blob = null,
                    slice = (file.slice || file.webkitSlice || file.mozSlice).name;

                blob = file[slice](loaded, loaded + block + 1);
                reader.readAsArrayBuffer(blob);
            }

            reader.onloadend = function (e) {
                if (this.readyState == FileReader.DONE) {
                    console.log(this.result);
                }
            }
            reader.onload = function (e) {
                loaded += e.total;

                var percent = loaded / fileSize;

                if (percent < 1) {
                    self.uploader.onProgress && self.uploader.onProgress(percent);
                    console.log(percent);
                    readblob();
                }
            };
            readblob();
        }
    }

    var fn = {
        init: function () {
            var self = this;
            if (self.dragDrop) {
                self.dragDrop.addEventListener('dragover', function (e) {
                    self._uploader.dragHover(e);
                }, false);

                self.dragDrop.addEventListener('dragleave', function (e) {
                    self._uploader.dragLeave(e);
                }, false);

                self.dragDrop.addEventListener('drop', function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).addClass('upload_drag_hover');
                }, false);
            }
            //文件选择控件选择
            if (self.fileInput) {
                self.fileInput.addEventListener('change', function (e) {
                    self.onSelect(e);
                }, false);
            }

            //上传按钮提交
            if (self.btnUpload) {
                self.btnUpload.addEventListener('click', function (e) {
                    e.preventDefault();
                    self._uploader.upload();
                }, false);
            }
        },
        upload: function () {
            var self = this,
                files = self._uploader.getFiles(this.fileInput, this.dragDrop);

            //非站点服务器上运行
            if (location.host.indexOf('sitepointstatic') >= 0) {
                return;
            }
            var fnUpload = function (file) {
                var xhr = new XMLHttpRequest();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function (e) {
                        self.onProgress(file, e.loaded, e.total);
                    }, false);

                    xhr.onreadystatechange = function (e) {
                        if (xhr.readyState == 4) {
                            if (xhr.status == 200) {
                                self.onSuccess(file, xhr.responseText);
                            }
                            else {
                                self.onFailure(file, xhr.responseText);
                            }
                        }
                    };
                    xhr.open('post', self.url, true);
                    xhr.setRequestHeader('X_FILENAME', file.name);
                    xhr.send(file);
                }
            };
            for (var i = 0, file; file = files[0]; i++) {
                fnUpload(file);
            }
        }
    };
    H5Uploader.prototype = fn;

    window.H5Uploader = H5Uploader;
})(window, jQuery);