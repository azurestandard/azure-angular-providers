'use strict';

/* Copyright 2015 Azure Standard (https://www.azurestandard.com/).
 * Released under the MIT license (http://opensource.org/licenses/MIT).
 *
 * AngularJS providers for Azure's API
 * (https://github.com/azurestandard/api-spec).
 */

var azureProvidersModule = angular
    .module('azureProviders', ['ngResource'])
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
        var _keys = {
            product: 'code',
            route: 'code',
        };
        var _headers = {
            'Accept': 'application/json',
        };
        var url = 'https://api.azurestandard.com';

        this.url = function(value) {
            url = value;
        };

        this.$get = ['$http', '$resource', function AzureAPIFactory($http, $resource) {
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
                var key = _keys[model] || 'id';
                resources[model] = $resource(
                    url + '/' + model + '/:' + key,
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
    .factory('AzureCarts', ['AzureAPI', function AzureCartsFactory(AzureAPI) {
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
                    line.productObject = AzureAPI.product.get({
                        code: line.product,
                    });
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
            var match = this.carts.some(function(cart) {
                if (cart.order.id === order_id) {
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
