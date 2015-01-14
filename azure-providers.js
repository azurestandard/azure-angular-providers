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
        product: 'code',
        route: 'code',
    })
    .provider('AzureAPI', function AzureAPIProvider() {
        var _models = [
            'brand',
            'category',
            'drop',
            'order',
            'order-line',
            'person',
            'product',
            'route',
            'trip',
        ];
        var _plurals = {
            'category': 'categories',
            'person': 'people',
        };
        var _headers = {
            'Accept': 'application/json',
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
                    var headers = {
                        'Authorization': 'Basic ' + window.btoa(
                            username + ':' + password),
                    };
                    for (var header in _headers) {
                        headers[header] = _headers[header];
                    }
                    return $http.get(
                        url + '/person',
                        {
                            headers: headers,
                            withCredentials: true
                        }
                    );
                },
            };
            _models.forEach(function(model) {
                var plural = _plurals[model] || model + 's';
                var identifier = AzureModelIdentifiers[model] || 'id';
                resources[model] = $resource(
                    url + '/' + model + '/:' + identifier,
                    {},
                    {
                        query: {
                            method: 'GET',
                            url: url + '/' + plural,
                            isArray: true,
                            withCredentials: true,
                            headers: _headers,
                        },
                        get: {
                            method: 'GET',
                            withCredentials: true,
                            headers: _headers,
                        }
                    }
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
    .factory('AzureProduct', ['$q', 'AzureObjectPromiseCache', function AzureProductFactory($q, AzureObjectPromiseCache) {
        var cache = new AzureObjectPromiseCache('product');

        var Product = function(code) {
            var _this = this;
            cache.getObjectPromise(code).then(function(product) {
                _this.product = product;
                _this.products = [product];
                _this.code = code;
                if (_this.product.repackaged.length) {
                    _this.product.repackaged.forEach(function(code) {
                        cache.getObjectPromise(code).then(function(product) {
                            _this.products.push(product);
                            _this.products.sort(function(a, b) {
                                return a.price.dollars - b.price.dollars;
                            });
                            return product;
                        });
                    });
                }
                return product;
            });
        };

        Product.prototype.selectPackaging = function(code) {
            var _this = this;
            var match = this.products.some(function(product) {
                if (product.code === code) {
                    _this.product = product;
                    _this.code = code;
                    return true;
                }
            });
            if (!match) {
                console.log('no match found for ' + code + ' in', this.products);
            }
        };

        return function(product) {
            var code;
            if (product.hasOwnProperty('code')) {
                code = product.code;
                cache.addObject(product);
            } else {
                code = product;
            }
            return new Product(code);
        };
    }])
    .factory('AzureCarts', ['AzureAPI', 'AzureProduct', function AzureCartsFactory(AzureAPI, AzureProduct) {
        var cart_sets = {};

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
            this.orderLines = AzureAPI['order-line'].query({
                order: order.id,
            });
            this.price = 0;
            this.weight = 0;
            this.products = 0;
            this.orderLines.$promise.then(function(lines) {
                lines.forEach(function(line) {
                    if (line.price['per-pound']) {
                        line.totalPrice = line.price.dollars * line.weight;
                    } else {
                        line.totalPrice =
                            line.price.dollars * line['quantity-ordered'];
                    }
                    _this.price += line.totalPrice;
                    _this.weight += line.weight;
                    _this.products += line['quantity-ordered'];
                    line.productClass = AzureProduct(line.product);
                });
            });
        };

        var Carts = function(person_id) {
            var _this = this;
            this.carts = [];
            this.cart = null;
            var orders = AzureAPI.order.query({
                person: person_id,
                status: 'cart',
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

        return function(person_id) {
            if (!cart_sets.hasOwnProperty(person_id)) {
                /* we don't have an existing instance */
                cart_sets[person_id] = new Carts(person_id);
            }
            return cart_sets[person_id];
        };
    }]);
