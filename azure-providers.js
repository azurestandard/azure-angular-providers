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
                this.$promise.category = cache.getObjectPromise(id);
                this.$promise.category.then(function(category) {
                    _this.category = category;
                    _this.ancestors = [category];
                    get_parent(_this, category);
                    return category;
                });
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
            if (this.category === undefined) {
                return [];
            }
            var _children = children[this.id];
            if (_children !== undefined) {
                return _children;
            }
            _children = [];
            children[this.id] = _children;
            var id = this.id;
            if (id === null) {
                id = 'null';
            }
            AzureAPI.category.query({
                parent: id,
            }).$promise.then(function(categories) {
                categories.forEach(function(category) {
                    cache.addObject(category);
                    var cat = new Category(category.id);
                    cat.$promise.category.then(function() {
                        _children.push(cat);
                        _children.sort(function(a, b) {
                            return a.category.name.localeCompare(
                                b.category.name);
                        });
                    });
                });
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

        var Product = function(code) {
            var _this = this;
            _this._categories = null;
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

        Product.prototype.categories = function() {
            if (!this.product) {
                return [];
            }
            if (this._categories === null) {
                var _this = this;
                this._categories = [];
                AzureAPI.category.query(
                    {product: this.code}
                ).$promise.then(function(categories) {
                    categories.forEach(function(category) {
                        _this._categories.push(new AzureCategory(category));
                    });
                });
            }
            return this._categories;
        };

        Product.prototype.primaryCategory = function() {
            return this.categories()[0];  // TODO: shortest chain through Bulk?
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
