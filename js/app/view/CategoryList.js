define(function(require, exports, module) {

var B = require('backbone'),
    _ = require('underscore');
    

var tmpl = [
        '<%= text %> [<%= size %>]'
    ].join('');


var CategoryItem = B.View.extend({
        template : _.template(tmpl),

        tagName : 'option',

        initialize : function(options) { },

        render : function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.attr('value', this.model.get('value'));
            return this;
        }
    }),

    CategoryList = B.View.extend({
        events : {
            'change' : 'changeCategory'
        },

        initialize : function() {
            this.listenTo(this.collection, 'reset', this.addAll);
        },

        addAll : function() {
            this.collection.each(this.addOne, this)
        },

        addOne : function(model) {
            var item = new CategoryItem({
                model : model,
                id : 'category-item-' + model.get('order')
            });

            this.$el.append(item.render().el);
        },

        select : function(value) {
            this.$el.val(value);
            this.changeCategory();
        }

        changeCategory : function() {
            this.trigger('change', this.$(':selected').val());
        }
    });

    
module.exports = CategoryList;

});