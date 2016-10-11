'use strict';

/* Copyright 2015 Azure Standard (https://www.azurestandard.com/).
 * Released under the MIT license (http://opensource.org/licenses/MIT).
 *
 * AngularJS providers for Azure's API
 * (https://github.com/azurestandard/api-spec).
 */

var azureProvidersModule = angular
    .module('azureProviders', ['ngResource', 'ngStorage', 'algoliasearch'])
    .constant('AzureModelIdentifiers', {
        'packaged-product': 'code',
        route: 'name',
    })
    .provider('AzureAPI', function AzureAPIProvider() {
        var _models = [
            'account-entry',
            'address',
            'audit-product',
            'brand',
            'category',
            'country',
            'drop',
            'drop-membership',
            'favorite',
            'faq',
            'notification',
            'notification-dismissal',
            'order',
            'order-line',
            'payment',
            'payment-method',
            'packaged-product',
            'packaged-product-tag',
            'packaged-product-tag-association',
            'person',
            'pickup',
            'product',
            'purchase-order',
            'region',
            'route',
            'route-stop',
            'stop',
            'trip',
        ];
        var _plurals = {
            'account-entry': 'account-entries',
            'address': 'addresses',
            'category': 'categories',
            'country': 'countries',
            'person': 'people',
        };

        // non-$resource endpoints that will use $http.post(...)
        var _posts = {
            login: {
                url: '/login',
                withCredentials: true,
            },
            logout: {
                url: '/logout',
                withCredentials: true,
            },
            register: {
                url: '/registration/register',
            },
            activate: {
                url: '/registration/confirm',
            },
            resendConfirmationEmail: {
                url: '/registration/resend',
            },
            resetPassword: {
                url: '/password/reset',
            },
            resetPasswordConfirm: {
                url: '/password/confirm',
            },
        };

        var _headers = {
            'Accept': 'application/json',
        };
        var _payloadHeaders = {
            'Content-Type': 'application/json; charset=UTF-8',
        };
        var url = 'https://api.azurestandard.com';

        this.setUrl = function(value) {
            url = value;
        };

        var algoliaApiKey = '';
        this.setAlgoliaApiKey = function(key) {
            algoliaApiKey = key;
        };

        var algoliaAppId = '';
        this.setAlgoliaAppId = function(id) {
            algoliaAppId = id;
        };

        var algoliaIndexNames = {
            'brand': 'brands',
            'category': 'categories',
            'drop': 'drops',
            'product': 'products',
        };

        this.setAlgoliaIndexNames = function(names) {
            angular.forEach(names, function(val, key) {
                algoliaIndexNames[key] = val;
            });
        };

        this.$get = ['$http', '$resource', 'algolia', 'AzureModelIdentifiers', function AzureAPIFactory($http, $resource, algolia, AzureModelIdentifiers) {
            var algoliaClient;
            if (algoliaAppId && algoliaApiKey) {
                algoliaClient = algolia.Client(algoliaAppId, algoliaApiKey, {protocol: 'https:'});
            }
            var payloadHeaders = {};
            for (var header in _headers) {
                payloadHeaders[header] = _headers[header];
            }
            for (var header in _payloadHeaders) {
                payloadHeaders[header] = _payloadHeaders[header];
            }
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
                algolia: algoliaClient,
            };

            var payloadHeaders = {};
            for (var header in _headers) {
                payloadHeaders[header] = _headers[header];
            }
            for (var header in _payloadHeaders) {
                payloadHeaders[header] = _payloadHeaders[header];
            }
            for (var name in _posts) {
                var postConfig = _posts[name];
                var config = {
                    headers: payloadHeaders,
                };
                if (postConfig.withCredentials) {
                    config.withCredentials = true;
                }
                resources[name] = (function(postConfig, config) {
                    return function(data) {
                        return $http.post(
                            url + postConfig.url,
                            data,
                            config
                        );
                    };
                })(postConfig, config);
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
                        headers: payloadHeaders,
                    },
                    get: {
                        method: 'GET',
                        withCredentials: true,
                        headers: _headers,
                    },
                    save: {
                        method: 'PUT',
                        withCredentials: true,
                        headers: payloadHeaders,
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
                        headers: payloadHeaders,
                    };
                    actions.mails = {
                        method: 'POST',
                        url: url + '/mail/' + plural,
                        withCredentials: true,
                        headers: payloadHeaders,
                    };
                }
                if (model === 'audit-product'){
                    actions = {
                        get: {
                            method: 'GET',
                            url: url + "/audit/product/" + ":" + identifier,
                            withCredentials: true,
                            headers: _headers,
                        },
                        query: {
                            method: "GET",
                            url: url + "/audit/products",
                            isArray: true,
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
                        save: {
                            method: 'POST',
                            url: url + "/audit/packaged-product/" + ":" + identifier,
                            withCredentials: true,
                            headers: payloadHeaders,
                        },
                    }
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
                if (model === 'drop') {
                    actions.locations = {
                        method: 'GET',
                        url: url + '/' + plural + '/locations',
                        isArray: true,
                        withCredentials: true,
                        headers: _headers,
                    };
                }
                resources[model] = $resource(
                    url + '/' + model + '/:' + identifier,
                    paramDefaults,
                    actions
                );
                if (algoliaClient && algoliaIndexNames.hasOwnProperty(model)) {
                    resources[model].algolia = algoliaClient.initIndex(algoliaIndexNames[model]);
                }
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

        ObjectPromiseCache.prototype._getFromApi = function(id) {
            var parameters = {};
            parameters[this.identifier] = id;
            return AzureAPI[this.model].get(parameters).$promise;
        }

        ObjectPromiseCache.prototype._getFromAlgolia = function(id) {
            var _this = this;
            return AzureAPI[this.model].algolia.getObject(id)
                .catch(function() {
                    return _this._getFromApi(id);
                });
        }

        ObjectPromiseCache.prototype.getObjectPromise = function(id) {
            var objectsEntry = this.objects[id];
            var promisesEntry = this.promises[id];
            if (objectsEntry) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                deferred.resolve(objectsEntry);
                return promise;
            } else if (promisesEntry) {
                return promisesEntry;
            } else {
                var _this = this;
                var promise;
                if (AzureAPI[this.model].hasOwnProperty('algolia')) {
                    promise = this._getFromAlgolia(id);
                } else {
                    promise = this._getFromApi(id);
                }
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

        var getParent = function(category, ancestor) {
            if (ancestor.parent) {
                cache.getObjectPromise(ancestor.parent).then(function(cat) {
                    category.ancestors.push(cat);
                    getParent(category, cat);
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
                category, _slug, slugs, parent, deferred, pathString) {
            var name = category['short-name'] || category.name;
            if (slug(name) === _slug) {
                if (slugs.length) {
                    _categoryByPath(slugs, category.id, deferred, pathString);
                } else {
                    deferred.resolve(new Category(category.id));
                }
                return true;
            }
        };

        var _categoryByPath = function(slugs, parent, deferred, pathString) {
            var slug = slugs.shift();
            if (!slug) {
                deferred.reject('empty slug from path ' + pathString);
                return;
            }
            for (var key in cache.objects) {
                var category = cache.objects[key];
                if (category.parent !== parent) {
                    continue;
                }
                var match = _categoryByPathCheck(
                    category, slug, slugs, parent, deferred, pathString);
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
                        category, slug, slugs, parent, deferred, pathString);
                });
                if (!match) {
                    deferred.reject('no match found for slug ' + slug +
                                    ' from path ' + pathString);
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
                        getParent(_this, category);
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
                        var name = _this.ancestors[i]['short-name'] || _this.ancestors[i].name;
                        chunks.push(slug(name));
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
        var packagedCache = {};

        var PackagedProduct = function(packagedProduct) {
            this.packaged = packagedProduct;
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
                _this.product.packaging.forEach(function(packagedProduct) {
                    var packaged = new PackagedProduct(packagedProduct);
                    _this.packaging.push(packaged);
                    promises.push(packaged.$promise);
                });
                return $q.all(promises).then(function() {
                    _this.packaging.sort(function(a, b) {
                        return a.packaged.price.retail.dollars -
                            b.packaged.price.retail.dollars;
                    });
                    _this.selectPackaging(code);
                }).then(function() {
                    return _this;
                });
            });
        };

        Product.prototype.selectPackaging = function(code) {
            var _this = this;
            var match = this.packaging.some(function(packagedProduct) {
                if (code) {
                    if (packagedProduct.packaged.code === code) {
                        _this.packaged = packagedProduct;
                        _this.code = code;
                        return true;
                    }
                } else if (packagedProduct.packaged.tags.indexOf(
                        'bargain-bin') == -1) {
                    _this.packaged = packagedProduct;
                    _this.code = packagedProduct.packaged.code;
                    return true;
                }
            });
            if (!match) {
                console.log(
                    'no match found for ' + code + ' in', this.packaging);
            }
        };

        function _handleProducts(code, products) {
            if (products.length !== 1) {
                throw new Error(
                    'expected one product match for packaged ' +
                        'product code ' + code + ', but got ' +
                        products.length);
            }
            return products[0];
        }

        function _getProductFromApi(code, queryParameters) {
            queryParameters['packaged-product'] = code;
            return AzureAPI.product.query(
                queryParameters
            ).$promise.then(function(products) {
                return _handleProducts(code, products);
            });
        }

        function _getProductFromAlgolia(code, queryParameters) {
            var algoliaParameters = {
                facets: '*',
                facetFilters: ['packaging.code:'+code],
            };
            angular.extend(algoliaParameters, queryParameters);
            return AzureAPI.product.algolia.search(
                algoliaParameters
            ).then(function(response) {
                if (response.hits.length < 1) {
                    return _getProductFromApi(code, queryParameters);
                }
                return _handleProducts(code, response.hits);
            });
        }

        return function(product, queryParameters) {
            var promise = null;
            var id;
            var code = null;
            if (product.hasOwnProperty('code')) {
                code = product.code;
                promise = packagedCache[code];
                if (!promise) {
                    if (queryParameters === undefined) {
                        queryParameters = {};
                    }

                    if (AzureAPI.product.algolia) {
                        promise = _getProductFromAlgolia(code, queryParameters);
                    } else {
                        promise = _getProductFromApi(code, queryParameters)
                    }

                    packagedCache[code] = promise;
                }
            } else if (product.hasOwnProperty('id')) {
                id = product.id;
                cache.addObject(product);
            } else {
                id = product;
            }
            if (!promise) {
                promise = cache.getObjectPromise(id);
            }
            return new Product(promise, code);
        };
    }]);