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

        var url = 'https://api.azurestandard.com';

        // allows the url to be set in tha app config
        this.url = function(value) {
            url = value;
        };

        // This is the factory that is returned.
        this.$get = ['$http', '$resource', 'AzureModelIdentifiers', function AzureAPIFactory($http, $resource, AzureModelIdentifiers) {


            // references and workers:
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

            var payload_headers = angular.extend({}, _headers, _payload_headers);

            var http_config = {
                headers: _headers,
                withCredentials: true
            };

            function pluralize(word) {
                return _plurals[word] || word + 's';
            }

            function get_identifier(model) {
                return AzureModelIdentifiers[model] || 'id';
            }

            var get_action = {
                method: 'GET',
                withCredentials: true,
                headers: _headers,
            };

            var save_action = {
                method: 'PUT',
                withCredentials: true,
                headers: payload_headers,
            };

            var delete_action = {
                method: 'DELETE',
                withCredentials: true,
                headers: _headers,
            };

            function resource_defaults(model){
                var identifier = get_identifier(model);
                var model_url = url + '/' + model + '/:' + identifier;

                return {
                    url: url + '/' + model + '/:' + identifier,
                    params: { identifier: '@' + identifier },
                    actions: default_actions(model),
                };
            }

            function default_actions(model){
                var plural = pluralize(model);

                var query_action = {
                    method: 'GET',
                    url: url + '/' + plural,
                    isArray: true,
                    withCredentials: true,
                    headers: _headers,
                };

                var count_action = {
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
                };

                var create_action = {
                    method: 'POST',
                    url: url + '/' + plural,
                    withCredentials: true,
                    headers: payload_headers,
                };

                return {
                    'query': query_action,
                    'count': count_action,
                    'create': create_action,
                    'get': get_action,
                    'save': save_action,
                    'delete': delete_action,
                };
            }

            function mail_actions(model){
                var mail = {
                    method: 'POST',
                    url: url + '/mail/' + model + '/:' + get_identifier(model),
                    withCredentials: true,
                    headers: payload_headers,
                };
                var mails = {
                    method: 'POST',
                    url: url + '/mail/' + pluralize(model),
                    withCredentials: true,
                    headers: payload_headers,
                };

                return {
                    mail: mail,
                    mails: mails
                };
            };

            // These return an angular $http object
            function login_resource(username, password) {
                var credentials = {
                    'username': username,
                    'password': password,
                };
                return $http.post(url + '/login', credentials, http_config);
            };

            function logout_resource() {
                return $http.post(url + '/logout', {}, http_config);
            }

            function register_resource(baseURL, person, address, telephone, drop) {
                // I think that the prameters should be passed as one object.
                // That way the developer can refer to the api-spec for the proper data formatting
                // without whaving to check the order of the parameters in this function.
                var data = {
                    'base-url': baseURL,
                    'person': person,
                    'address': address,
                    'telephone': telephone,
                    'drop': drop,
                },
                var config = { headers: _headers };
                return $http.post(url + '/registration/register', data, config );
            }

            function activate_resource(token) {
                var config = { headers: _headers };
                return $http.post(url + '/registration/confirm', { token: token }, config);
            };

            function resend_confirmation_resource(token, baseURL) {
                var data = {
                    token: token,
                    'base-url': baseURL,
                };
                var config = { headers: _headers };
                return $http.post(url + '/registration/resend', data, config);
            }

            // these return an angular $resource object
            function build_session_resource(){
                return $resource(url + '/session', {}, {get: get_action});
            }

            function build_account_entry_resource(){
                var data = resource_defaults('account-entry');
                return $resource(data.url, data.params, data.actions);
            }

            function build_address_resource(){
                var data = resource_defaults('address');
                return $resource(data.url, data.params, data.actions);
            }

            function build_brand_resource(){
                var data = resource_defaults('brand');
                return $resource(data.url, data.params, data.actions);
            }

            function build_category_resource(){
                var data = resource_defaults('category');
                return $resource(data.url, data.params, data.actions);
            }

            function build_drop_resource(){
                var data = resource_defaults('drop');

                data.actions.locations = {
                    method: 'GET',
                    url: url + '/' + pluralize('drop') + '/locations',
                    isArray: true,
                    withCredentials: true,
                    headers: _headers,
                };

                return $resource(data.url, data.params, data.actions);
            }

            function build_notification_resource(){
                var data = resource_defaults('notification');
                return $resource(data.url, data.params, data.actions);
            }

            function build_notification_dismissal_resource(){
                var data = resource_defaults('notification-dismissal');
                return $resource(data.url, data.params, data.actions);
            }

            function build_order_resource(){
                var data = resource_defaults('order');
                return $resource(data.url, data.params, data.actions);
            }

            function build_order_line_resource(){
                var data = resource_defaults('order-line');
                return $resource(data.url, data.params, data.actions);
            }

            function build_payment_method_resource(){
                var data = resource_defaults('payment-method');
                return $resource(data.url, data.params, data.actions);
            }

            function build_packaged_product_resource(){
                var data = resource_defaults('packaged-product');

                var categoryUrl = url + '/packaged-product/:' + get_identifier('packaged-product') +
                    '/category/:categoryId';
                var params = {'categoryId': '@categoryId'};
                data.actions.addCategory = {
                    method: 'POST',
                    url: categoryUrl,
                    params: params,
                    withCredentials: true,
                    headers: _headers,
                };
                data.actions.removeCategory = {
                    method: 'DELETE',
                    url: categoryUrl,
                    params: params,
                    withCredentials: true,
                    headers: _headers,
                };

                return $resource(data.url, data.params, data.actions);
            }

            function build_person_resource(){
                var data = resource_defaults('person');
                angular.extend(data.actions, mail_actions('trip'));
                return $resource(data.url, data.params, data.actions);
            }

            function build_product_resource(){
                var data = resource_defaults('product');
                return $resource(data.url, data.params, data.actions);
            }

            function build_purchase_order_resource(){
                var data = resource_defaults('purchase-order');
                return $resource(data.url, data.params, data.actions);
            }

            function build_route_resource(){
                var data = resource_defaults('route');
                angular.extend(data.actions, mail_actions('trip'));
                return $resource(data.url, data.params, data.actions);
            }

            function build_route_stop_resource(){
                var data = resource_defaults('route-stop');
                return $resource(data.url, data.params, data.actions);
            }

            function build_stop_resource(){
                var data = resource_defaults('notification');
                return $resource(data.url, data.params, data.actions);
            }

            function build_trip_resource(){
                var data = resource_defaults('trip');
                angular.extend(data.actions, mail_actions('trip'));
                return $resource(data.url, data.params, data.actions);
            }

            return {
                'login': login_resource,
                'logout': logout_resource,
                'register': register_resource,
                'activate': activate_resource,
                'resendConfirmationEmail': resend_confirmation_resource,
                'session': build_session_resource(),
                'account-entry': build_account_entry_resource(),
                'address': build_address_resource(),
                'brand': build_brand_resource(),
                'category': build_category_resource(),
                'drop': build_drop_resource(),
                'notification': build_notification_resource(),
                'notification-dismissal': build_notification_dismissal_resource(),
                'order': build_order_resource(),
                'order-line': build_order_line_resource(),
                'payment-method': build_payment_method_resource(),
                'packaged-product': build_packaged_product_resource(),
                'person': build_person_resource(),
                'product': build_product_resource(),
                'purchase-order': build_purchase_order_resource(),
                'route': build_route_resource(),
                'route-stop': build_route_stop_resource(),
                'stop': build_stop_resource(),
                'trip': build_trip_resource(),
            };

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
    .factory('AzureOrderLine', ['AzureProduct', function AzureOrderLineFactory(AzureProduct) {
        var OrderLine = function (orderLine) {
            this.orderLine = orderLine;
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

        return OrderLine;
    }])
    .factory('AzureOrder', ['AzureAPI', 'AzureOrderLine', function AzureOrderFactory(AzureAPI, AzureOrderLine) {
        var Order = function(order) {
            this.order = order;
            if (order.drop) {
                this._drop();
            }
            if (order.trip) {
                this._stop();
            }
            if (order['checkout-payment']) {
                this._payment();
            }
            this._getOrderLines();
            return this;
        };

        Order.prototype._newOrderLine = function(orderLine) {
            return new AzureOrderLine(orderLine);
        };

        Order.prototype._drop = function() {
            this.drop = AzureAPI.drop.get({
                id: this.order.drop,
                person: this.order.customer
            });
        };

        Order.prototype._stop = function() {
            this.stop = AzureAPI.stop.query({
                trip: this.order.trip
            });
        };

        Order.prototype._payment = function() {
            this.payment = AzureAPI['payment-method'].get({
                id: this.order['checkout-payment'].method
            });
        };

        Order.prototype._calculateTotals = function() {
            var _this = this;
            this.price = 0;
            this.weight = 0;
            this.products = 0;
            this.shipping = 0;
            this.orderLines.forEach(function(line) {
                _this.price += line.price;
                _this.weight += line.orderLine.weight;
                _this.products += line.orderLine['quantity-ordered'];
            });
        };

        Order.prototype._calculateShipping = function() {
            if (this.order['checkout-payment']) {
                this.shipping = this.order['checkout-payment'].amount - this.price;
            }
        };

        Order.prototype._getOrderLines = function() {
            var _this = this;
            this.orderLines = [];

            AzureAPI['order-line'].query({
                order: this.order.id,
                limit: 250,
            }).$promise.then(function(lines) {
                lines.forEach(function(line) {
                    _this.orderLines.push(_this._newOrderLine(line));
                });
                _this._calculateTotals();
                _this._calculateShipping();
            });
        };

        return Order;
    }])
    .factory('AzureOrders', ['AzureAPI', 'AzureOrder', function AzureOrdersFactory(AzureAPI, AzureOrder) {
        var orderSets = {};

        var Orders = function(personId) {
            var _this = this;
            this.orders = [];
            var orders = AzureAPI.order.query({
                person: personId,
                limit: 250,
            });
            orders.$promise.then(function(orders) {
                orders.forEach(function(order) {
                    _this.orders.push(new AzureOrder(order));
                });
                // TODO: sort by (estimated) delivery date
            });
        };

        return function(personId) {
            if (!orderSets.hasOwnProperty(personId)) {
                /* we don't have an existing instance */
                orderSets[personId] = new Orders(personId);
            }
            return orderSets[personId];
        };
    }])
    .factory('AzureCarts', ['AzureAPI', 'AzureOrder', 'AzureOrderLine', function AzureCartsFactory(AzureAPI, AzureOrder, AzureOrderLine) {
        var cart_sets = {};

        var OrderLine = function(orderLine, cart) {
            AzureOrderLine.call(this, orderLine);
            this.cart = cart;
        };

        OrderLine.prototype = Object.create(AzureOrderLine.prototype);
        OrderLine.prototype.constructor = OrderLine;

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
            AzureOrder.call(this, order);
        };

        Cart.prototype = Object.create(AzureOrder.prototype);
        Cart.prototype.constructor = Cart;

        Cart.prototype._newOrderLine = function (orderLine) {
            return new OrderLine(orderLine, this);
        };

        Cart.prototype.addLine = function(productCode, quantityOrdered) {
            var _this = this;
            var resource = AzureAPI['order-line'].create({
              'order': this.order.id,
              'packaged-product': productCode,
              'quantity-ordered': quantityOrdered,
            });
            resource.$promise.then(function(orderLine) {
                var line = _this._newOrderLine(orderLine);
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
