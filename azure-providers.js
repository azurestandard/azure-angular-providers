/* Copyright 2017 Azure Standard (https://www.azurestandard.com/).
 * Released under the MIT license (http://opensource.org/licenses/MIT).
 *
 * AngularJS providers for Azure's API
 * (https://github.com/azurestandard/api-spec).
 */

(function(angular) {
    'use strict';

    angular
        .module('azureProviders', ['ngResource'])
        .constant('AzureModelIdentifiers', {
            'bartender-host': 'code',
            'packaged-product': 'code',
            route: 'name',
            warehouse: 'code'
        })
        .provider('AzureAPI', AzureAPIProvider);

    function AzureAPIProvider() {
        var _models = [
            'account-entry',
            'address',
            'affiliate-referral',
            'audit-product',
            'bartender-host',
            'bartender-print-configuration',
            'bartender-template',
            'brand',
            'category',
            'country',
            'drop',
            'drop-membership',
            'email',
            'favorite',
            'faq',
            'notification',
            'notification-dismissal',
            'order',
            'order-fee',
            'order-line',
            'payment',
            'payment-method',
            'packaged-product',
            'packaged-product-tag',
            'packaged-product-tag-association',
            'person',
            'pickup',
            'printer',
            'product',
            'purchase',
            'region',
            'route',
            'route-stop',
            'stop',
            'trip',
            'warehouse'
        ];
        var _plurals = {
            'account-entry': 'account-entries',
            address: 'addresses',
            category: 'categories',
            country: 'countries',
            person: 'people'
        };

        // non-$resource endpoints that will use $http.post(...)
        var _posts = {
            login: {
                url: '/login',
                withCredentials: true
            },
            logout: {
                url: '/logout',
                withCredentials: true
            },
            register: {
                url: '/registration/register',
                withCredentials: true
            },
            resendRegistrationEmail: {
                url: '/registration/resend'
            },
            resetPassword: {
                url: '/password/reset'
            },
            resetPasswordConfirm: {
                url: '/password/confirm'
            }
        };

        var _headers = {
            Accept: 'application/json'
        };
        var _payloadHeaders = {
            'Content-Type': 'application/json; charset=UTF-8'
        };
        var _apiUrl = 'https://api.azurestandard.com';

        this.setUrl = function(value) {
            _apiUrl = value;
        };

        this.$get = ['$http', '$resource', 'AzureModelIdentifiers', AzureAPIFactory];

        function AzureAPIFactory($http, $resource, AzureModelIdentifiers) {
            var payloadHeaders = {};
            for (var header in _headers) {
                payloadHeaders[header] = _headers[header];
            }
            for (var payloadHeader in _payloadHeaders) {
                payloadHeaders[payloadHeader] = _payloadHeaders[payloadHeader];
            }
            var resources = {
                session: $resource(
                    _apiUrl + '/session',
                    {},
                    {
                        get: {
                            method: 'GET',
                            withCredentials: true,
                            headers: _headers
                        }
                    }
                )
            };

            for (var name in _posts) {
                var postConfig = _posts[name];
                var config = {
                    headers: payloadHeaders
                };
                if (postConfig.withCredentials) {
                    config.withCredentials = true;
                }
                resources[name] = createPost(postConfig, config);
            }
            _models.forEach(function(model) {
                var plural = _plurals[model] || model + 's';
                var identifier = AzureModelIdentifiers[model] || 'id';
                var paramDefaults = {};
                paramDefaults[identifier] = '@' + identifier;
                var actions = {
                    query: {
                        method: 'GET',
                        url: _apiUrl + '/' + plural,
                        isArray: true,
                        withCredentials: true,
                        headers: _headers
                    },
                    count: {
                        method: 'HEAD',
                        url: _apiUrl + '/' + plural,
                        params: {
                            limit: 0
                        },
                        withCredentials: true,
                        headers: _headers,
                        interceptor: {
                            response: function(response) {
                                response.resource.count = parseInt(
                                    response.headers('Count')
                                );
                                return response;
                            }
                        }
                    },
                    create: {
                        method: 'POST',
                        url: _apiUrl + '/' + plural,
                        withCredentials: true,
                        headers: payloadHeaders
                    },
                    get: {
                        method: 'GET',
                        withCredentials: true,
                        headers: _headers
                    },
                    save: {
                        method: 'PUT',
                        withCredentials: true,
                        headers: payloadHeaders
                    },
                    delete: {
                        method: 'DELETE',
                        withCredentials: true,
                        headers: _headers
                    }
                };
                if (['person', 'route', 'trip'].indexOf(model) !== -1) {
                    actions.mail = {
                        method: 'POST',
                        url: _apiUrl + '/mail/' + model + '/:' + identifier,
                        withCredentials: true,
                        headers: payloadHeaders
                    };
                    actions.mails = {
                        method: 'POST',
                        url: _apiUrl + '/mail/' + plural,
                        withCredentials: true,
                        headers: payloadHeaders
                    };
                }
                if (model === 'person') {
                    actions.findAffiliateCodeByMarketingSlug = {
                        method: 'GET',
                        url:
                            _apiUrl +
                            '/' +
                            plural +
                            '/actions/find-affiliate-code-by-marketing-slug/:marketingSlug',
                        withCredentials: true,
                        headers: _headers
                    };
                } else if (model === 'audit-product') {
                    actions = {
                        get: {
                            method: 'GET',
                            url: _apiUrl + '/audit/product/' + ':' + identifier,
                            withCredentials: true,
                            headers: _headers
                        },
                        query: {
                            method: 'GET',
                            url: _apiUrl + '/audit/products',
                            isArray: true,
                            withCredentials: true,
                            headers: _headers,
                            interceptor: {
                                response: function(response) {
                                    response.resource.count = parseInt(
                                        response.headers('Count')
                                    );
                                    return response;
                                }
                            }
                        },
                        save: {
                            method: 'POST',
                            url: _apiUrl + '/audit/packaged-product/' + ':' + identifier,
                            withCredentials: true,
                            headers: payloadHeaders
                        }
                    };
                } else if (model === 'order') {
                    actions.parcelCarrierEstimates = {
                        method: 'GET',
                        url:
                            _apiUrl +
                            '/order/:' +
                            identifier +
                            '/parcel-carrier-fee-estimates',
                        isArray: true,
                        withCredentials: true,
                        headers: _headers
                    };
                } else if (model === 'packaged-product') {
                    var categoryUrl =
                        _apiUrl +
                        '/' +
                        model +
                        '/:' +
                        identifier +
                        '/category/:categoryId';
                    var params = {
                        categoryId: '@categoryId'
                    };
                    actions.addCategory = {
                        method: 'POST',
                        url: categoryUrl,
                        params: params,
                        withCredentials: true,
                        headers: _headers
                    };
                    actions.removeCategory = {
                        method: 'DELETE',
                        url: categoryUrl,
                        params: params,
                        withCredentials: true,
                        headers: _headers
                    };
                    actions.old = {
                        method: 'GET',
                        url: _apiUrl + '/' + model + '/old/:id',
                        params: {
                            id: '@id'
                        },
                        withCredentials: true,
                        headers: _headers
                    };
                } else if (model === 'drop') {
                    actions.locations = {
                        method: 'GET',
                        url: _apiUrl + '/' + plural + '/locations',
                        isArray: true,
                        withCredentials: true,
                        headers: _headers
                    };
                } else if (model === 'bartender-print-configuration') {
                    actions.testPrint = {
                        method: 'POST',
                        url:
                            _apiUrl +
                            '/' +
                            model +
                            '/:' +
                            identifier +
                            '/actions/test-print',
                        withCredentials: true,
                        headers: _headers
                    };
                }
                resources[model] = $resource(
                    _apiUrl + '/' + model + '/:' + identifier,
                    paramDefaults,
                    actions
                );
            });

            //================================================================================

            function createPost(postConfig, config) {
                return function(data) {
                    return $http.post(_apiUrl + postConfig.url, data, config);
                };
            }

            //================================================================================

            return resources;
        }
    }
})(angular);
