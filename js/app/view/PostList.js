define(function(require, exports, module) {

var queue = require('tool/queue'),

    B = require('backbone'),
    _ = require('underscore');


var 

    /*
        博客列表项的html模板
    */

    tmpl = [
        '<div class="expt_date fx-300"><%= date %></div>',
        '<h3><a class="fx-300" href="<%= url %>" target="_blank"><%= title %></a></h3>',
        '<div class="expt_info">',
            '<p><i class="fa fa-tag"></i><% for(var i = 0; i < tags.length; i++){ %><span><%= tags[i] %></span><% } %></p>',
        '</div>',
        '<%= _.unescape(excerpt) %>'
    ].join(''),

    dateRex = /^\d{2}\s((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s\d{4})$/i;


var 
    
    /*
        博客列表项
    */

    PostItem = B.View.extend({
        template : _.template(tmpl),

        tagName : 'li',

        className : 'expt_item',

        initialize : function(options) {
            this.id = options.id;

            /*
                获取文章对应的月份，如：JAN 2012
            */

            this.date = this.model.get('date').replace(dateRex, function(all, month) {
                return month;
            });


            this.listenTo(this.model, 'select', this.toggleVisible);
        },

        render : function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        insertTo : function($parent, silent) {
            var delay = Math.floor(Math.random() * 500),
                fx = 'fade-' +  this.id;

            /*
                将列表项插入的dom树中
                并随机延时后显示
                fade-in，fade-out 是包含css3动画的类
            */

            this.$el.appendTo($parent);

            if (!silent) {

                /*
                    这里之所以会用js来控制delay
                    是因为，无法直接在elem.style属性中插入animation-delay属性
                */

                queue.add(fx, function() {
                    this.$el.addClass('fade-out');

                    queue.next(fx);
                }, this);

                queue.add(fx, function() {
                    _.delay(function() {
                        queue.next(fx);
                    }, delay);
                }, this)

                queue.add(fx, function() {
                    this.$el.removeClass('fade-out');
                    this.$el.addClass('fade-in');

                    queue.next(fx);
                }, this);

                queue.next(fx);
            }
        },

        remove : function() {
            /*
                列表项从dom树上移除
            */

            this.$el.removeClass('fade-in');
            this.$el.detach();
        },

        height : function() {
            return this.$el.outerHeight(true);
        },

        offset : function(scrollTop) {
            return this.$el.offset().top - (scrollTop || 0);
        },

        toggleVisible : function(visible) {
            this.visible = visible;
        },

        isVisible : function() {
            return this.visible;
        },

        getDate : function() {
            return this.date;
        }
    }),

    
    /*
        博客列表
    */

    PostList = B.View.extend({
        initialize : function() {
            this.$left = this.$('.expt_list-left');
            this.$right = this.$('.expt_list-right');
            this.$tag = this.$('.expt_tag');
            this.$comment = this.$('.expt_comment');


            /*
                当第一次加载post数据，
                collection会触发reset事件
            */

            this.listenTo(this.collection, 'reset', this.addAll);

            /*
                当post数据发送变化时，
                collection会触发update事件
            */
            this.listenTo(this.collection, 'update', this.updateAll);
        },

        clearItems : function() {
            _.invoke(this.items, 'remove');
        },

        insertItem : function(item) {
            if (!item.isVisible()) return;

            if (this.curOffset.left <= this.curOffset.right) {
                item.insertTo(this.$left);
                this.curOffset.left += item.height();
            } else {
                item.insertTo(this.$right);
                this.curOffset.right += item.height();
            }
        },

        addAll : function() {
            /*
                首先从dom树移除所有的item
                重置curOffset和item的值
            */

            this.clearItems();

            this.curOffset = {
                left : 0,
                right : this.$tag.outerHeight()
            };
            this.items = [];

            /*
                历遍所有post数据
                从新生成新的列表项
            */

            this.collection.each(this.addOne, this);

            /*
                最后调整列表项的位置
                以放下评论框
            */

            this.adjustOffset();
        },

        addOne : function(model) {
            var item = new PostItem({
                    model : model,
                    id : 'post-item-' + model.get('order')
                });

            this.items.push(item);
            this.insertItem(item.render());
        },

        updateAll : function() {
            /*
                首先从dom树移除所有的item
                重置curOffset
            */

            this.clearItems();

            this.curOffset = {
                left : 0,
                right : this.$tag.outerHeight()
            };

            /*
                历遍所有items
                从新生成渲染和插入dom树
            */

            _.each(this.items, this.updateOne, this);

            /*
                最后调整列表项的位置
                以放下评论框
            */

            this.adjustOffset();
        },

        updateOne : function(item) {
            this.insertItem(item.render());
        },

        adjustOffset : function() {
            var len = this.items.length,
                start = len,
                offset = 0,
                item,
                items = [];

            while (start--) {
                item = this.items[start];

                if (item.isVisible()) {
                    items.unshift(item);
                    offset += item.height();

                    if (offset >= PostList.COMMENT_OFFSET) {
                        break;
                    }
                }
            }

            _.invoke(items, 'insertTo', this.$left, true);
        },

        getCurDate : function(scrollTop) {
            var min = Number.POSITIVE_INFINITY,
                date;

            _.each(this.items, function(item) {
                var offset = item.offset(scrollTop);

                if (offset > PostList.TOP_OFFSET && offset < min) {
                    date = item.getDate();
                    min = offset;
                }
            });

            return date;
        }
    }, {
        COMMENT_OFFSET : 500,
        TOP_OFFSET : 30
    });

    
module.exports = PostList;

});