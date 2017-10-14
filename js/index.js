// String.prototype
~function (pro) {
    //->获取URL地址栏问号后面的参数值及HASH值
    function queryURLParameter() {
        var obj = {},
            reg = /([^?=&#]+)=([^?=&#]+)/g;
        this.replace(reg, function () {
            obj[arguments[1]] = arguments[2];
        });
        reg = /#([^?=&#]+)/;
        if (reg.test(this)) {
            obj["hash"] = reg.exec(this)[1];
        }
        return obj;
    }

    //->格式化时间字符串
    function formatTime(template) {
        template = template || "{0}年{1}月{2}日 {3}时{4}分{5}秒";
        var _this = this,
            ary = _this.match(/\d+/g);//->[2016,05,19]
        template = template.replace(/\{(\d+)\}/g, function () {
            var val = ary[arguments[1]];
            typeof val === "undefined" ? val = 0 : null;
            val = val.length < 2 ? "0" + val : val;
            return val;
        });
        return template;
    }

    pro.queryURLParameter = queryURLParameter;
    pro.formatTime = formatTime;
}(String.prototype);

// rem
~function () {
    var desW = 640,
        winW = document.documentElement.clientWidth || document.body.clientWidth;
    if (winW > desW) {
        // $('.main').css('width', desW);
        document.getElementById("main").style.width = desW + 'px';
        return;
    }
    document.documentElement.style.fontSize = winW / desW * 100 + 'px';
}();

// header
~function () {
    var $header = $(".header"),
        $menu = $header.find(".menu"),
        $nav = $header.children(".nav");
    $menu.singleTap(function () {
        if ($(this).attr('isBlock') === 'true') {
            var timer = window.setTimeout(function () {
                $nav.css({
                    padding: '0 0'
                });
                window.clearTimeout(timer);
            }, 300);
            $nav.css({
                height: '0'
            });
            $(this).attr('isBlock', false);
            return;
        }
        $nav.css({
            padding: '.1rem 0',
            height: '2.22rem'
        });
        $(this).attr('isBlock', true);
    });
}();

// matchInfo
var matchRender = (function () {
    var $matchInfo = $('.matchInfo'),
        $matchInfoTemplate = $('#matchInfoTemplate');

    // bind event
    function bindEvent() {
        var $bottom = $matchInfo.children('.bottom'),
            $bottomLeft = $bottom.children('.home'),
            $bottomRight = $bottom.children('.away');

        // 获取本地存储信息。判断是否有支持
        var support = localStorage.getItem('support');
        if (support) {
            support = JSON.parse(support);
            if (support.isTap) {
                $bottom.attr("isTap", true);
                support.type == 1 ? $bottomLeft.addClass('bg') : $bottomRight.addClass('bg');
            }
        }
        $matchInfo.tap(function (ev) {
            var tar = ev.target,
                tarTag = tar.tagName,
                tarP = tar.parentNode,
                $tar = $(tar),
                $tarP = $tar.parent(),
                tarInn = $tar.html();
            // 支持操作
            if (tarTag === 'SPAN' && tarP.className === 'bottom' && tar.className !== 'type') {
                // 在页面不刷新的情况下只能点击一次
                if ($bottom.attr('isTap') === 'true') return;

                // 增加背景颜色和数字
                $tar.html(parseFloat(tarInn) + 1).addClass('bg');

                // 重新的计算进度条
                $matchInfo.children('.middle').children('span').css('width', (parseFloat($bottomLeft.html())
                    / (parseFloat($bottomLeft.html()) + parseFloat($bottomRight.html()))) * 100 + '%');

                // 告诉服务器支持的是谁
                $.ajax({
                    url: 'http://matchweb.sports.qq.com/kbs/teamSupport?mid=100002:2365&type=' + $tar.attr('type'),
                    dataType: 'jsonp'
                });

                //只能点击一次
                $bottom.attr('isTap', true);
                localStorage.setItem('support', JSON.stringify({"isTap": true, "type": $tar.attr('type')}));
            }
        });
    }

    // bind html
    function bindHTML(matchInfo) {
        $matchInfo.html(ejs.render($matchInfoTemplate.html(), {matchInfo: matchInfo}));

        // 控制进度条:设置定时器是为了给HTML一定的渲染时间
        window.setTimeout(function () {
            var leftNum = parseFloat(matchInfo.leftSupport),
                rightNum = parseFloat(matchInfo.rightSupport);
            $matchInfo.children('.middle').children('span').css('width', (leftNum / (leftNum + rightNum)) * 100 + '%');
        }, 500);

        bindEvent();
    }

    return {
        init: function () {
            // get data
            $.ajax({
                url: 'http://matchweb.sports.qq.com/html/matchDetail?mid=100002:2365',
                dataType: 'jsonp',
                success: function (result) {
                    if (result && result[0] == 0) {
                        result = result[1];
                        var matchInfo = result['matchInfo'];
                        matchInfo['leftSupport'] = result['leftSupport'];
                        matchInfo['rightSupport'] = result['rightSupport'];

                        // bind html
                        bindHTML(matchInfo);
                    }
                }

            });
        }
    }
})();
matchRender.init();

// matchList
var matchListRender = (function () {
    var $matchList = $('.matchList'),
        $matchListUL = $matchList.children('ul'),
        $matchListTemplate = $('#matchListTemplate');

    function bindHTML(matchList) {
        $matchListUL.html(ejs.render($matchListTemplate.html(), {matchList: matchList}))
            .css('width', parseFloat(document.documentElement.style.fontSize) * 2.4 * matchList.length + 20 + 'px');

        // 实现局部滚动
        new IScroll('.matchList', {
            scrollX: true,
            scrollY: false,
            click: true
        });
    }

    return {
        init: function () {
            $.ajax({
                url: 'http://matchweb.sports.qq.com/html/matchStatV37?mid=100002:2365',
                dataType: 'jsonp',
                success: function (result) {
                    if (result && result[0] == 0) {
                        result = result[1]['stats'];
                        var matchList = null;
                        $.each(result, function (index, item) {
                            if (item['type'] == 9) {
                                matchList = item['list'];
                                return false;
                            }
                        });
                        // bindHTML
                        bindHTML(matchList);
                    }
                }
            });
        }
    }
})();
matchListRender.init();