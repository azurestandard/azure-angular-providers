/* Copyright 2017 Azure Standard (https://www.azurestandard.com/).
 * Released under the MIT license (http://opensource.org/licenses/MIT).
 *
 * AngularJS providers for Azure's API
 * (https://github.com/azurestandard/api-spec).
 */

(function (angular) {
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
             'bulk-move-orders',
             'category',
             'country',
             'drop',
             'drop-membership',
             'drop-hierarchy',
             'email',
             'favorite',
             'faq',
             'notification',
             'notification-dismissal',
             'order',
             'order-fee',
             'order-frequency-segment',
             'order-line',
             'order-promo-code',
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
             'reward',
             'route',
             'route-stop',
             'stop',
             'trip',
             'truckload',
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
             },
             getNmiStepOneFormSubmitUrl: {
                url: '/nmi-step1-form-url',
                withCredentials: true
             },
             processNmiStepThree: {
                url: '/nmi-process-step3',
                withCredentials: true
             },
             checkCaptchaResponse: {
                url: '/check-captcha',
                withCredentials: true
             }
       };
 
       var _headers = {
             Accept: 'application/json'
       };
       var _payloadHeaders = {
             'Content-Type': 'application/json; charset=UTF-8'
       };
       var _apiUrl = 'https://api.azurestandard.com';
 
       this.setUrl = function (value) {
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
                resources[name] = createPost(postConfig.url, config);
             }
             _models.forEach(function (model) {
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
                            response: function (response) {
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
                   update: {
                         method: 'PATCH',
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
                   actions.message = {
                         method: 'POST',
                         url: _apiUrl + '/message/' + model + '/:' + identifier,
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
                   actions.orderedPackagedProducts = {
                         method: 'GET',
                         url: _apiUrl + '/person/:' + identifier + '/ordered-packaged-products',
                         isArray: true,
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
                               response: function (response) {
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
                } else if (model === 'drop-hierarchy') {
                   actions.get = {
                      method: 'GET',
                      url: _apiUrl + '/v2/drop-hierarchy',
                      withCredentials: true,
                      headers: _headers,
                      isArray: true,
                   }
                } else if (model === 'bulk-move-orders') {
                   actions.create = {
                      method: 'POST',
                      url: _apiUrl + '/v2/drops/bulk-move-orders',
                      withCredentials: true,
                      headers: _headers,
                      isArray: false,
                   }
                }
                resources[model] = $resource(
                   _apiUrl + '/' + model + '/:' + identifier,
                   paramDefaults,
                   actions
                );
             });
 
             //================================================================================
 
             function createPost(url, config) {
                return function (data, params) {
                   var postConfig = angular.extend({}, config, { params: params });
                   return $http.post(_apiUrl + url, data, postConfig);
                };
             }
 
             //================================================================================
 
             return resources;
       }
    }
 })(angular);
