'use strict';

/* Copyright 2015 Azure Standard (https://www.azurestandard.com/).
 * Released under the MIT license (http://opensource.org/licenses/MIT).
 *
 * AngularJS providers for Azure's API
 * (https://github.com/azurestandard/api-spec).
 */

var azureProvidersModule = angular
    .module('azureProviders', ['ngResource'])
    .constant('AzureModelIdentifiers', {
        'packaged-product': 'code',
        route: 'name',
    })
    .provider('AzureAPI', function AzureAPIProvider() {
        var _models = [
            'account-entry',
            'address',
            'brand',
            'category',
            'drop',
            'notification',
            'notification-dismissal',
            'order',
            'order-line',
            'payment-method',
            'packaged-product',
            'person',
            'product',
            'purchase-order',
            'route',
            'route-stop',
            'stop',
            'trip',
        ];
        var _plurals = {
            'account-entry': 'account-entries',
            'address': 'addresses',
            'category': 'categories',
            'person': 'people',
        };
        var _headers = {
            'Accept': 'application/json',
        };
        var _payload_headers = {
            'Content-Type': 'application/json; charset=UTF-8',
        };
        var url = 'https://api.azurestandard.com';

        this.url = function(value) {
            url = value;
        };

        this.$get = ['$http', '$resource', 'AzureModelIdentifiers', function AzureAPIFactory($http, $resource, AzureModelIdentifiers) {
            var resources = {
                session: $resource(
                    url + '/session',
                    {},
                    {
                        get: {
                            method: 'GET',
                            withCredentials: true,
                            headers: _headers,
                        }
                    }
                ),
                login: function(username, password) {
                    return $http.post(
                        url + '/login',
                        {
                            'username': username,
                            'password': password,
                        },
                        {
                            headers: _headers,
                            withCredentials: true
                        }
                    );
                },
                logout: function() {
                    return $http.post(
                        url + '/logout',
                        {},
                        {
                            headers: _headers,
                            withCredentials: true
                        }
                    );
                },
            };
            var payload_headers = {};
            for (var header in _headers) {
                payload_headers[header] = _headers[header];
            }
            for (var header in _payload_headers) {
                payload_headers[header] = _payload_headers[header];
            }
            _models.forEach(function(model) {
                var plural = _plurals[model] || model + 's';
                var identifier = AzureModelIdentifiers[model] || 'id';
                var paramDefaults = {};
                paramDefaults[identifier] = '@' + identifier;
                var actions = {
                    query: {
                        method: 'GET',
                        url: url + '/' + plural,
                        isArray: true,
                        withCredentials: true,
                        headers: _headers,
                    },
                    count: {
                        method: 'HEAD',
                        url: url + '/' + plural,
                        params: {
                            limit: 0,
                        },
                        withCredentials: true,
                        headers: _headers,
                        interceptor: {
                            response: function(response) {
                                response.resource.count = parseInt(
                                    response.headers('Count'));
                                return response;
                            },
                        },
                    },
                    create: {
                        method: 'POST',
                        url: url + '/' + plural,
                        withCredentials: true,
                        headers: payload_headers,
                    },
                    get: {
                        method: 'GET',
                        withCredentials: true,
                        headers: _headers,
                    },
                    save: {
                        method: 'PUT',
                        withCredentials: true,
                        headers: payload_headers,
                    },
                    'delete': {
                        method: 'DELETE',
                        withCredentials: true,
                        headers: _headers,
                    },
                };
                if (['person', 'route', 'trip'].indexOf(model) !== -1) {
                    actions.mail = {
                        method: 'POST',
                        url: url + '/mail/' + model + '/:' + identifier,
                        withCredentials: true,
                        headers: payload_headers,
                    };
                    actions.mails = {
                        method: 'POST',
                        url: url + '/mail/' + plural,
                        withCredentials: true,
                        headers: payload_headers,
                    };
                }
                if (model === 'packaged-product') {
                    var categoryUrl = url + '/' + model + '/:' + identifier +
                        '/category/:categoryId';
                    var params = {'categoryId': '@categoryId'};
                    actions.addCategory = {
                        method: 'POST',
                        url: categoryUrl,
                        params: params,
                        withCredentials: true,
                        headers: _headers,
                    };
                    actions.removeCategory = {
                        method: 'DELETE',
                        url: categoryUrl,
                        params: params,
                        withCredentials: true,
                        headers: _headers,
                    };
                }
                resources[model] = $resource(
                    url + '/' + model + '/:' + identifier,
                    paramDefaults,
                    actions
                );
            });
            return resources;
        }]
    })
    .factory('AzureObjectPromiseCache', ['$q', 'AzureAPI', 'AzureModelIdentifiers', function AzureObjectPromiseCacheFactory($q, AzureAPI, AzureModelIdentifiers) {
        var ObjectPromiseCache = function(model) {
            this.model = model;  /* model name */
            this.identifier = AzureModelIdentifiers[model] || 'id';
            this.objects = {}    /* objects returned by the API */
            this.promises = {};  /* objects in flight */
        };

        ObjectPromiseCache.prototype.addObject = function(object) {
            var id = object[this.identifier];
            this.objects[id] = object;
        };

        ObjectPromiseCache.prototype.getObjectPromise = function(id) {
            var objects_entry = this.objects[id];
            var promises_entry = this.promises[id];
            if (objects_entry) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                deferred.resolve(objects_entry);
                return promise;
            } else if (promises_entry) {
                return promises_entry;
            } else {
                var _this = this;
                var parameters = {};
                parameters[this.identifier] = id;
                var promise = AzureAPI[this.model].get(parameters).$promise;
                this.promises[id] = promise;
                promise.then(function(object) {
                    _this.objects[id] = object;
                    delete _this.promises[id];
                    return object;
                });
                return promise;
            }
        };

        return function(model) {
            return new ObjectPromiseCache(model);
        };
    }])
    .factory('AzureCategory', ['$q', 'AzureAPI', 'AzureObjectPromiseCache', function AzureCategoryFactory($q, AzureAPI, AzureObjectPromiseCache) {
        var cache = new AzureObjectPromiseCache('category');
        var children = {};

        var get_parent = function(category, ancestor) {
            if (ancestor.parent !== null) {
                cache.getObjectPromise(ancestor.parent).then(function(cat) {
                    category.ancestors.push(cat);
                    get_parent(category, cat);
                    return cat;
                });
            }
        };

        var slug = function(text) {
            text = text.toLowerCase();
            text = text.replace(/[\W\s]+/g, '-');
            text = text.replace(/^-+/, '');
            text = text.replace(/-+$/, '');
            return text;
        }

        var _categoryByPathCheck = function(
                category, _slug, slugs, parent, deferred, path_string) {
            if (slug(category.name) === _slug) {
                if (slugs.length) {
                    _categoryByPath(slugs, category.id, deferred, path_string);
                } else {
                    deferred.resolve(new Category(category.id));
                }
                return true;
            }
        };

        var _categoryByPath = function(slugs, parent, deferred, path_string) {
            var slug = slugs.shift();
            if (!slug) {
                deferred.reject('empty slug from path ' + path_string);
                return;
            }
            for (var key in cache.objects) {
                var category = cache.objects[key];
                if (category.parent !== parent) {
                    continue;
                }
                var match = _categoryByPathCheck(
                    category, slug, slugs, parent, deferred, path_string);
                if (match) {
                    return;
                }
            }
            if (parent === null) {
                parent = 'null';
            }
            AzureAPI.category.query({
                parent: parent,
                limit: 250,
            }).$promise.then(function(categories) {
                categories.forEach(function(category) {
                    cache.addObject(category);
                });
                var match = categories.some(function(category) {
                    return _categoryByPathCheck(
                        category, slug, slugs, parent, deferred, path_string);
                });
                if (!match) {
                    deferred.reject('no match found for slug ' + slug +
                                    ' from path ' + path_string);
                    return;
                }
            });
        };

        var categoryByPath = function(path) {
            var deferred = $q.defer();
            var slugs = path.split('/');
            if (slugs.length) {
                _categoryByPath(slugs, null, deferred, path);
            } else {
                deferred.reject('no slugs for path ' + path);
            }
            return deferred.promise;
        };

        var Category = function(id) {
            this.id = id;
            this.ancestors = null;
            this.$promise = {};
            if (id === null) {
                this.category = null;
            } else {
                var _this = this;
                this.$promise.category = cache.getObjectPromise(id).then(
                    function(category) {
                        _this.category = category;
                        _this.ancestors = [category];
                        get_parent(_this, category);
                        return category;
                    }
                );
            }
        };

        Category.prototype.path = function(category) {
            category = typeof category !== 'undefined' ?
                category : this.category;
            var id;
            if (category.hasOwnProperty('id')) {
                id = category.id;
            } else {
                id = category;
            }
            var match = false;
            if (this.ancestors === null) {
                return null;
            }
            var _this = this;
            var p = null;
            var match = this.ancestors.some(function(cat, index) {
                if (cat.id === id) {
                    var chunks = [];
                    for (var i = _this.ancestors.length - 1; i >= index; i--) {
                        chunks.push(slug(_this.ancestors[i].name));
                    }
                    p = chunks.join('/');
                    return true;
                }
                return null;
            });
            if (!match) {
                console.log(
                    'no match found for ' + id + ' in', this.ancestors);
            }
            return p;
        };

        Category.prototype.children = function() {
            var _children = children[this.id];
            if (_children !== undefined) {
                return _children;
            }
            _children = [];
            children[this.id] = _children;
            var promises = [];
            var id = this.id;
            if (id === null) {
                id = 'null';
            }
            var promise = AzureAPI.category.query({
                parent: id,
                limit: 250,
            }).$promise.then(function(categories) {
                categories.forEach(function(category) {
                    cache.addObject(category);
                    var cat = new Category(category.id);
                    promises.push(cat.$promise.category.then(function() {
                        _children.push(cat);
                        _children.sort(function(a, b) {
                            return a.category.name.localeCompare(
                                b.category.name);
                        });
                        return _children;
                    }));
                });
                return _children;
            });
            promises.push(promise);
            _children.$promise = $q.all(promises).then(function(results) {
                return results[0]
            });
            return _children;
        };

        return function(category) {
            var id;
            if (category === null ||
                    category === parseInt(category, 10)) {
                id = category;
            } else if (category.hasOwnProperty('id')) {
                id = category.id;
                cache.addObject(category);
            } else {
                return categoryByPath(category);
            }
            return new Category(id);
        };
    }])
    .factory('AzureProduct', ['$q', 'AzureAPI', 'AzureCategory', 'AzureObjectPromiseCache', function AzureProductFactory($q, AzureAPI, AzureCategory, AzureObjectPromiseCache) {
        var cache = new AzureObjectPromiseCache('product');
        var packaged_cache = {};

        var PackagedProduct = function(packaged_product) {
            this.packaged = packaged_product;
            this._categories = null;
        };

        PackagedProduct.prototype.categories = function() {
            if (this._categories === null) {
                var _this = this;
                this._categories = [];
                AzureAPI.category.query({
                    'packaged-product': this.packaged.code,
                    limit: 250,
                }).$promise.then(function(categories) {
                    categories.forEach(function(category) {
                        _this._categories.push(new AzureCategory(category));
                    });
                });
            }
            return this._categories;
        };

        PackagedProduct.prototype.primaryCategory = function() {
            return this.categories()[0];  // TODO: shortest chain through Bulk?
        };

        var Product = function(promise, code) {
            var _this = this;
            this.$promise = promise.then(function(product) {
                _this.product = product;
                _this.packaging = [];
                var promises = [];
                _this.product.packaging.forEach(function(packaged_product) {
                    var packaged = new PackagedProduct(packaged_product);
                    _this.packaging.push(packaged);
                    promises.push(packaged.$promise);
                });
                return $q.all(promises).then(function() {
                    _this.packaging.sort(function(a, b) {
                        return a.packaged.price.dollars -
                            b.packaged.price.dollars;
                    });
                    _this.selectPackaging(code);
                }).then(function() {
                    return _this;
                });
            });
        };

        Product.prototype.selectPackaging = function(code) {
            var _this = this;
            var match = this.packaging.some(function(packaged_product) {
                if (code) {
                    if (packaged_product.packaged.code === code) {
                        _this.packaged = packaged_product;
                        _this.code = code;
                        return true;
                    }
                } else if (packaged_product.packaged.tags.indexOf(
                        'bargain-bin') == -1) {
                    _this.packaged = packaged_product;
                    _this.code = packaged_product.packaged.code;
                    return true;
                }
            });
            if (!match) {
                console.log(
                    'no match found for ' + code + ' in', this.packaging);
            }
        };

        return function(product, queryParameters) {
            var promise = null;
            var id;
            var code = null;
            if (product.hasOwnProperty('code')) {
                code = product.code;
                promise = packaged_cache[code];
                if (!promise) {
                    if (queryParameters === undefined) {
                        queryParameters = {};
                    }
                    queryParameters['packaged-product'] = code;
                    promise = AzureAPI.product.query(
                        queryParameters
                    ).$promise.then(function(products) {
                        if (products.length !== 1) {
                            throw new Error(
                                'expected one product match for packaged ' +
                                'product code ' + code + ', but got ' +
                                products.length);
                        }
                        return cache.getObjectPromise(products[0].id);
                    });
                    packaged_cache[code] = promise;
                }
            } else if (product.hasOwnProperty('id')) {
                id = product.id;
            } else {
                id = product;
            }
            if (!promise) {
                promise = cache.getObjectPromise(id);
            }
            return new Product(promise, code);
        };
    }])
    .factory('AzureCarts', ['AzureAPI', 'AzureProduct', function AzureCartsFactory(AzureAPI, AzureProduct) {
        var cart_sets = {};

        var OrderLine = function(orderLine, cart) {
            this.orderLine = orderLine;
            this.cart = cart;
            this._calculatePrice();
            this.product = AzureProduct({code: orderLine['packaged-product']});
        };

        OrderLine.prototype._calculatePrice = function() {
            if (this.orderLine.price['per-pound']) {
                this.price =
                    this.orderLine.price.dollars * this.orderLine.weight;
            } else {
                this.price =
                    this.orderLine.price.dollars *
                    this.orderLine['quantity-ordered'];
            }
        };

        OrderLine.prototype.save = function() {
            var _this = this;
            var data = {};
            var ignore = {
                'price': true,
                'weight': true,
            };
            for (var attr in this.orderLine) {
                if (this.orderLine.hasOwnProperty(attr) && !ignore[attr]) {
                    data[attr] = this.orderLine[attr];
                }
            }
            var resource = AzureAPI['order-line'].save(data);
            resource.$promise.then(function(line) {
                _this.orderLine = line;
                _this._calculatePrice();
                _this.cart._calculateTotals();
                return line;
            });
            return resource.$promise;
        };

        OrderLine.prototype.delete = function() {
            var resource = this.orderLine.$delete();
            var index = this.cart.orderLines.indexOf(this);
            this.cart.orderLines.splice(index, 1);
            this.cart._calculateTotals();
            return resource.$promise;
        };

        OrderLine.prototype.increment = function() {
            this.orderLine['quantity-ordered'] += 1;
            save(this)
        };

        OrderLine.prototype.decrement = function() {
            if (this.orderLine['quantity-ordered'] > 1) {
                this.orderLine['quantity-ordered'] -= 1;
                save(this);
            }
        };

        function saveUntilItSticks(resource) {
            resource.orderLine['quantity-ordered'] = resource['$quantity-ordered'];
            resource.save().then(function(newResource) {
                if (newResource['quantity-ordered'] === resource['$quantity-ordered']) {
                    delete resource['$quantity-ordered'];
                } else {
                    saveUntilItSticks(resource);
                }
                return newResource;
            });
        };

        function save(resource) {
            var inFlight = resource['$quantity-ordered'];
            resource['$quantity-ordered'] = resource.orderLine['quantity-ordered'];
            if (!inFlight) {
                saveUntilItSticks(resource);
            }
        };

        var Cart = function(order) {
            var _this = this;
            this.order = order;
            if (order.drop) {
                this.drop = AzureAPI.drop.get({
                    id: order.drop,
                });
            }
            if (order.trip) {
                this.trip = AzureAPI.trip.get({
                    id: order.trip,
                });
            }
            this.orderLines = [];
            AzureAPI['order-line'].query({
                order: order.id,
                limit: 250,
            }).$promise.then(function(lines) {
                lines.forEach(function(orderLine) {
                    var line = new OrderLine(orderLine, _this);
                    _this.orderLines.push(line);
                });
                _this._calculateTotals();
            });
        };

        Cart.prototype._calculateTotals = function() {
            var _this = this;
            this.price = 0;
            this.weight = 0;
            this.products = 0;
            this.orderLines.forEach(function(line) {
                _this.price += line.price;
                _this.weight += line.orderLine.weight;
                _this.products += line.orderLine['quantity-ordered'];
            });
        };

        Cart.prototype.addLine = function(productCode, quantityOrdered) {
            var _this = this;
            var resource = AzureAPI['order-line'].create({
              'order': this.order.id,
              'packaged-product': productCode,
              'quantity-ordered': quantityOrdered,
            });
            resource.$promise.then(function(orderLine) {
                var line = new OrderLine(orderLine, _this);
                _this.orderLines.push(line);
                _this._calculateTotals();
                return orderLine;
            });
            return resource.$promise;
        };

        var Carts = function(person_id) {
            var _this = this;
            this.carts = [];
            this.cart = null;
            var orders = AzureAPI.order.query({
                person: person_id,
                status: 'cart',
                limit: 250,
            });
            orders.$promise.then(function(orders) {
                orders.forEach(function(order) {
                    _this.carts.push(new Cart(order));
                });
                _this.cart = _this.carts[0];  // TODO: pick next-to-cutoff cart
            });
        };

        Carts.prototype.selectCart = function(order_id) {
            var _this = this;
            var match = this.carts.some(function(cart) {
                if (cart.order.id === order_id) {
                    _this.cart = cart;
                    return true;
                }
            });
            if (!match) {
                console.log('no match found for ' + order_id + ' in', this.carts);
            }
        };

        Carts.prototype.createCart = function(order, select) {
            var _this = this;

            var createCart = function(order) {
                var cart = new Cart(order);
                _this.carts.push(cart);
                if (select) {
                    _this.cart = cart;
                }
            };

            if (order.id === undefined) {
                order = AzureAPI.order.create(order);
                order.$promise.then(createCart);
            } else {
                createCart(order);
            }
        };

        var objectSubset = function(a, b) {  /* Is 'a' a subset of 'b'? */
            for (var key in a) {
                var aVal = a[key];
                if (!b.hasOwnProperty(key)) {
                    return false;
                }
                var bVal = b[key];
                if (typeof(aVal) === 'object') {
                    if (typeof(bVal) === 'object') {
                        return objectSubset(aVal, bVal);
                    }
                    return false;
                } else if (typeof(bVal) === 'object') {
                    return false;
                }
                return aVal === bVal;
            }
            return true;
        };

        Carts.prototype.findCart = function(parameters) {
            var _this = this;
            var match = null;
            this.carts.some(function(cart) {
                if (objectSubset(parameters, cart)) {
                    match = cart;
                    return true;
                }
            });
            if (match) {
                return match;
            }
            throw new Error(
                'no match found for ' + JSON.stringify(parameters));
        };

        return function(person_id) {
            if (!cart_sets.hasOwnProperty(person_id)) {
                /* we don't have an existing instance */
                cart_sets[person_id] = new Carts(person_id);
            }
            return cart_sets[person_id];
        };
    }]);
