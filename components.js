var TextComponent = Component(
    [
        ['text']
    ],

    ['value'],
    [],

    function(value) {

    },

    function(value) {
        this.view[0].element.data = value
    }
)

var ButtonComponent = Component(
    [
        ['button', [
            [TextComponent]
        ]]
    ],

    ['text'],
    ['click'],

    function(text, click) {
        this.view[0][0].value = 'Button'

        this.view[0].element.onclick = function() {
            click()
        }
    },

    function(text, click) {
        this.view[0][0].value = text
    }
)

var InputComponent = Component(
    [
        ['input']
    ],

    ['value'],
    ['valueChange'],

    function(value, valueChange) {
        var inputElement = this.view[0].element

        inputElement.oninput = function() {
            valueChange(inputElement.value)
        }
    },

    function(value, valueChange) {
        this.view[0].element.value = value
    }
)

var GridComponent = Component(
    [
        ['div', 'inner-content']
    ],

    ['rows', 'columns', 'gap'],
    [],

    function(rows, columns, gap) {
        var element = this.view[0].element
        var style = element.style

        style.display = 'grid'
    },

    function(rows, columns, gap) {
        var element = this.view[0].element
        var style = element.style

        if(this.changedInput == 0)
            style.gridTemplateRows = rows
        else if(this.changedInput == 1)
            style.gridTemplateColumns = columns
        else if(this.changedInput == 2)
            style.gap = gap
    }
)

var ListComponent = Component(
    [],

    ['template', 'items'],
    ['itemChange'],

    function(template, items, itemChange) {
        this.views = []
    },

    function(template, items, itemChange) {
        if(this.changedInput == 0) {
            this.template = template
        }
        else if(this.changedInput == 1) {
            var parent = this.parent
            var templateComponent = this.template

            this.views.forEach(function(view) {
                deleteView(view)
            })

            this.views.splice(this.views.length, 0)

            var views = this.views

            items.forEach(function(item, index){
                var component = templateComponent(parent)
                component.value = item

                component.valueChange = function(data) {
                    itemChange({
                        data: data,
                        index: index
                    })
                }

                views[index] = component
            })
        }
    }
)