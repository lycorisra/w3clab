/*
    exists：判断数组(数组元素为对象)中是否存在指定键值对的元素
    @name：对象的属性名称
    @value：对象的属性值
*/
Array.prototype.exists = function (name, value) {
    for (var i = 0, item; item = this[i]; i++) {
        if (item[name] == value) {
            return true;
        }
    }
    return false;
};
/*
    find：从当前数组中，根据键值对查找第一个满足条件的元素
    @name：对象的属性名称
    @value：对象的属性值
*/
Array.prototype.find = function (name, value) {
    for (var i = 0, item; item = this[i]; i++) {
        if (item[name] == value) {
            return item;
        }
    }
    return null;
};
/*
    render：将javascript模版渲染成相应的html代码
    @data：json对象
*/
String.prototype.render = function (data) {
    var html = '';

    html += this.replace(/\$\w+\$/gi, function (match) {
        var result = data[match.replace(/\$/g, '')] || '';
        return result;
    });
    return html;
}

var utils = {

}

var period = {
    //格式化日期
    formatDate: function (date, format) {
        var paddNum = function (num) {
            num += "";
            return num.replace(/^(\d)$/, "0$1");
        }

        if (typeof date === 'string') {
            date = date.replace('T', ' ');
            date = new Date(date);//如果传过来的是日期字符串，则转换为日期对象
        };

        //指定格式字符
        var cfg = {
            yyyy: date.getFullYear() //年 : 4位
          , yy: date.getFullYear().toString().substring(2)//年 : 2位
          , M: date.getMonth() + 1  //月 : 如果1位的时候不补0
          , MM: paddNum(date.getMonth() + 1) //月 : 如果1位的时候补0
          , d: date.getDate()   //日 : 如果1位的时候不补0
          , dd: paddNum(date.getDate())//日 : 如果1位的时候补0
          , hh: date.getHours()  //时
          , mm: date.getMinutes() //分
          , ss: date.getSeconds() //秒
        }

        format || (format = "yyyy-MM-dd hh:mm:ss");
        return format.replace(/([a-z])(\1)*/ig, function (m) { return cfg[m]; });
    },
    /*
       new Date在不同浏览器中支持的写法都不同，最兼容的写法是yyyy/MM/dd
       其他写法在部分浏览器中无法解析
       如，IE7不支持(yyyy-MM-dd，只支持/分割)
       chrome支持的种类很多
       Firefox支持yyyy/M/d但不支持yyyy-M-d等
    */
    getDate: function (date) {
        var d = new Date(date);
        return d;
    },
    addDay: function (date, num) {
        var d = this.getDate(date);
        d.setDate(d.getDate() + num);

        var m = d.getMonth() + 1,
            result = d.getFullYear() + '/' + m + '/' + d.getDate();
        return result;
    },
    addMonth: function (date, num) {
        var d = this.getDate(date);
        d.setMonth(d.getMonth() + num);

        var m = d.getMonth() + 1,
            result = d.getFullYear() + '/' + m + '/' + d.getDate();
        return result;
    },
    transform: function (arrow) {
        var curPeriod = $('#period').data('period') || '2016/02',
            refDate = curPeriod + '/25',               //时间格式：yyyy/MM/dd
            beginDate,
            endDate;

        if (arrow == 0) {                             //上一个周期
            beginDate = this.addMonth(refDate, -2);
            endDate = this.addDay(refDate, -1);
            endDate = this.addMonth(endDate, -1);

            var d = this.getDate(endDate);
            $('#period').data('period', [d.getFullYear(), d.getMonth() + 1].join('/'));
        }
        else {                                         //下一个周期                    
            beginDate = refDate;
            endDate = this.addMonth(refDate, 1);
            endDate = this.addDay(endDate, -1);

            var d = this.getDate(endDate);
            $('#period').data('period', [d.getFullYear(), d.getMonth() + 1].join('/'));
        }
        $('#period').val([beginDate, endDate].join(' ~ '));
    }
};

var form = {
    get: function (form) {
        var array = $(form).serializeArray(),
            data = {};

        $(array).each(function (i, e) {
            if (data[e.name]) {
                data[e.name] += ',' + e.value;
            }
            else {
                data[e.name] = e.value;
            }
        });
        array = $(form).find('[data-name]');
        $(array).each(function (i, e) {
            var name = $(e).attr('data-name'),
                value = $(e).html();
            if (data[name]) {
                data[name] += ',' + value;
            }
            else {
                data[name] = value;
            }
        });
        return data;
    },
    set: function (data, form) {
        if (data && form) {
            for (var name in data) {
                var el = $('[name="' + name + '"]', form);
                if (el.length > 0) {
                    el.val(data[name]);
                }
                else {
                    el = $('[data-name="' + name + '"]', form);
                    el.html(data[name]);
                }
            }
        }
    }
};

function PageHandler(form) {
    this.form = form;
    this.url = form.action;
};
PageHandler.prototype = {
    loadgrid: function (action, tableId, params) {
        var data = form.get(this.form),
            dict = { ajaxData: data };

        data = $.extend({}, data, params);
        tableId = tableId || 'datatable';

        BindGridData(tableId, this.url + '?OpType=' + action, dict, false, 20, false);
    },
    outExcel: function (action) {
        var frameId = 'myFrame9527',
            formId = 'myForm9527',
            myIframe,
            myForm;

        if ($('#' + frameId).length > 0) {
            $('#' + frameId).remove();
        }
        if ($('#' + formId).length > 0) {
            $('#' + formId).remove();
        }
        myIframe = document.createElement('iframe');
        myIframe.style.display = 'none';
        myIframe.id = frameId;
        myIframe.name = frameId;

        myForm = document.createElement('form');
        myForm.style.display = 'none';
        myForm.id = formId;
        myForm.method = 'post';
        myForm.target = frameId;
        myForm.action = this.url + '?OpType=' + action + '&page=' + location.pathname.split('/').pop();

        var array = $('#searchForm').serializeArray();
        $(array).each(function (i, e) {
            var input = $('<input type="hidden" name="' + e.name + '" value="' + e.value + '" />');
            myForm.appendChild(input[0]);
        });

        var index = layer.load(0, { shade: true, shade: 0.6 }); //0代表加载的风格，支持0-2
        var callback = function () {
            var msg = myIframe.contentWindow.document.body.innerText;
            msg && msg != '' && layer.alert(msg, { icon: 2 }, function () {
                $(myIframe).unbind();
                layer.close(index);
            });
        }
        document.body.appendChild(myIframe);
        document.body.appendChild(myForm);

        myForm.submit();
        $(myIframe).load(callback);

        setTimeout(function () {
            //layer.close(index);
            $(document).one('click', function () {
                layer.close(index);
            });
        }, 5000);
    },
    showWin: function (options) {
        var defaults = {
            type: 1,
            shade: 0.4,
            shadeClose: false,
            scrollbar: false,
            area: ['600px', '280px']
        },
            opt = $.extend({}, defaults, options),
            form = $(opt.form)[0] || opt.content[0];

        //form && form.reset && form.reset();

        opt.success = function () {
            (typeof opt.callback === 'function') && opt.callback();

            opt.data && Common.setForm(opt.data, form);
        }
        layer.open(opt);
    },
    showRemoteWin: function (url, options, callback) {
        var self = this;
        if ($('#infoWin').length === 0) {
            $('<div id="infoWin"></div>').appendTo('body');
        }
        $('#infoWin').load(url, function () {
            callback && callback();
            self.showWin(options);

        });
    },
    /*
        参数说明：
        @action：Action
        @form：表单
        @callback：回调函数
        @extradata：附加数据
    */
    modify: function (action, form, callback, extradata) {
        var index = layer.load(0, { shade: true, shade: 0.6 }); //0代表加载的风格，支持0-2
        var data = $.extend({}, this.getform(form), extradata);
        $.ajax({
            type: 'post',
            url: this.url + '?OpType=' + action,
            data: data,
            dataType: 'json',
            success: function (data) {
                var icon = data && data.result ? { icon: 1 } : { icon: 2 };
                layer.alert(data.msg, icon, function () {
                    callback && callback(data);
                    layer.closeAll();
                    //$(form)[0] && $(form)[0].reset();
                });
            },
            error: function () {
                layer.closeAll();
            }
        });
    },
    //删除一条数据
    del: function (action, data, callback) {
        var self = this;
        layer.confirm('是否删除该条记录？', { icon: 3 }, function () {
            $.ajax({
                url: self.url + '?OpType=' + action,
                data: data,
                dataType: 'json',
                success: function (data) {
                    var icon = data.result ? { icon: 1 } : { icon: 2 };
                    layer.alert(data.msg, icon, function () {
                        callback && callback();
                    });
                }
            });
        });
    }
};