function createElement(name) {
    switch(name) {
        case 'text':
            return document.createTextNode(name)
        break

        default:
            return document.createElement(name)
    }
}

function draw(parent, model, inputs, outputs, init, update) {
    var bindings = []

    model.forEach(function(item) {
        if(typeof item[0] == 'function') {
            bindings.push({
                getter: item[0](parent, item[1])
            })
        }
        else {
            var element = createElement(item[0])
            parent.appendChild(element)

            var inner
            var innerComponents = item[1]

            if(innerComponents)
                inner = draw(element, innerComponents)

            var getter = new Proxy(bindings, {
                get: function(object, key) {
                    switch(key) {
                        case 'element':
                            return element

                        case 'parent':
                            return parent

                        default:
                            return inner && inner[key]
                    }
                },

                set: function(object, key, value) {
                    switch(key) {
                        default:
                            inner[key] = value
                    }
                }
            })

            bindings.push({
                getter: getter,
                inner:  inner
            })
        }
    })

    var proxy = new Proxy(bindings, {
        get: function(object, key) {
            if(key == 'bindings')
                return bindings

            if(key == 'parent')
                return parent

            if(!bindings[key])
                return

            return bindings[key].getter
        },

        set: function(object, key, value) {
            var binding = bindings[key]

            if(binding)
                binding.setter[key] = value
        }
    })

    if(!inputs) {
        return proxy
    }

    var outputListeners = outputs.map(function(){
        return undefined
    })

    var values = inputs
        .map(function(){})
        .concat(
            outputs
                .map(function(output, index){
                    return function(a) {
                        var listener = outputListeners[index]

                        if(listener)
                            listener(a)
                    }
                })
        )

    var self = {
        view: proxy,
        values: values,
        parent: parent,
        changedInput: undefined
    }

    init.apply(self, self.values)

    inputs.forEach(function(input) {
        bindings[input] = {
            setter: new Proxy({}, {
                get: function(object, key) {

                },

                set: function(object, key, value) {
                    var inputIndex = inputs.indexOf(key)

                    if(update) {
                        self.values[inputIndex] = value
                        self.changedInput = inputIndex
                        update.apply(self, self.values)
                    }
                }
            })
        }
    })

    outputs.forEach(function(output) {
        bindings[output] = {
            setter: new Proxy({}, {
                get: function(object, key) {

                },

                set: function(object, key, value) {
                    var outputIndex = outputs.indexOf(key)
                    outputListeners[outputIndex] = value
                }
            })
        }
    })

    return proxy
}

function deleteView(view) {
    var bindings = view.bindings

    if(bindings) {
        for(var i = 0; ; ++i) {
            var binding = bindings[i]

            if(!binding)
                break

            var getter = binding.getter

            if(getter)
                deleteView(getter)

            delete bindings[i]
        }
    }

    if(view.element) {
        //console.log(view.parent, view.element)
        view.parent.removeChild(view.element)
    }
}

function Component(view, inputs, outputs, init, update) {
    var innerContentIndieces = []

    function getInnerContentIndex(nodes, innerContentPath) {
        nodes.forEach(function(node, index) {
            if(node[1] == 'inner-content')
                innerContentIndieces.push(innerContentPath.concat([index]))
            else if(Array.isArray(node[1])) {
                innerContentPath.push(index)
                getInnerContentIndex(node[1], innerContentPath)
                innerContentPath.pop()
            }
        })
    }

    getInnerContentIndex(view, innerContentIndieces)

    return function(parent, innerComponents) {
        if(innerComponents){
            innerContentIndieces.forEach(function(index){
                var innerIndexNode = view

                for(var i = 0; i < index.length; ++i)
                    innerIndexNode = innerIndexNode[index[i]]

                innerIndexNode[1] = innerComponents
            })
        }

        var viewModel = draw(parent, view, inputs, outputs, init, update)
        return viewModel
    }
}