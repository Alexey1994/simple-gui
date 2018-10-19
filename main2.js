function draw(parent, model, inputs, outputs, redraw) {
    var bindings = []

    model.forEach(function(item) {
        if(typeof item[0] == 'function') {
            var evalString = 'item[0](parent'

            for(var i = 1; i < item.length; ++i)
                evalString += ',item[' + i + ']'

            evalString += ')'

            bindings.push({
                getter: eval(evalString)
            })
        }
        else
        switch(item[0]) {
            case 'text':
                var element = document.createTextNode(item[1])
                parent.appendChild(element)

                var setter = new Proxy({}, {
                    get: function(object, key) {
                        return element.data
                    },

                    set: function(object, key, value) {
                        element.data = value
                    }
                })

                bindings.push({
                    setter: setter,
                    value: item[1]
                })
                break

            case 'grid':
                var element = document.createElement('span')
                var style = element.style
                style.display = 'grid'
                style.gridTemplateColumns = 'min-content min-content'
                style.gridGap = '10px'
                parent.appendChild(element)

                var inner = draw(element, item[1])

                /*var setter = new Proxy({}, {
                    get: function(object, key) {
                        return element.data
                    },

                    set: function(object, key, value) {
                        element.data = value
                    }
                })

                bindings.push({
                    setter: setter,
                    value: item[1]
                })*/

                bindings.push({
                    inner: inner
                })
                break

            default:
                var element = document.createElement(item[0])
                var style = element.style
                parent.appendChild(element)

                var inner = draw(element, item[1])

                var getter = new Proxy({}, {
                    get: function(object, key) {
                        switch(key) {
                            case 'style':
                                return new Proxy({}, {
                                    get: function(object, key) {
                                        return style[key]
                                    },

                                    set: function(object, key, value) {
                                        style[key] = value
                                    }
                                })
                                break

                            case 'element':
                                return element

                            default:
                                return inner[key]
                        }
                    },

                    set: function(object, key, value) {
                        switch(key) {
                            case 'style':
                                style[key] = value
                                break

                            default:
                                inner[key] = value
                        }
                    }
                })

                var setter = new Proxy({}, {
                    get: function(object, key) {

                    },

                    set: function(object, key, value) {

                    }
                })

                bindings.push({
                    getter: getter,
                    setter: setter,
                    inner:  inner
                })
                break
        }
    })

    var proxy = new Proxy(bindings, {
        get: function(object, key) {
            return bindings[key].getter
        },

        set: function(object, key, value) {
            bindings[key].setter[key] = value
        }
    })

    if(inputs) {
        var outputListeners = outputs
            .map(function(){
                return []/*{
                    listeners: [],
                    sender: function(a) {
                        console.log('send', a)

                        this.listeners.forEach(function(listener) {
                            listener(a)
                        })
                    }
                }*/
            })

        var values = inputs
            .map(function(){})
            .concat(
                outputs
                    .map(function(output, index){
                        return function(a) {
                            outputListeners[index]
                                .forEach(function(listener) {
                                    listener(a)
                                })
                        }
                    })
            )

        var self = {
            view: proxy,
            values: values,
            changedInput: undefined
        }

        inputs.forEach(function(input) {
            bindings[input] = {
                setter: new Proxy({}, {
                    get: function(object, key) {

                    },

                    set: function(object, key, value) {
                        var inputIndex = inputs.indexOf(key)

                        if(redraw) {
                            self.values[inputIndex] = value
                            self.changedInput = inputIndex
                            redraw.apply(self, self.values)
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
                        outputListeners[outputIndex].push(value)
                    }
                })
            }
        })
    }

    return proxy
}