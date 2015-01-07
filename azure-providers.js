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
        var url = 'https://api.azurestandard.com';

        this.url = function(value) {
            url = value;
        };

        this.$get = ['$resource', function AzureAPIFactory($resource) {
            var resources = {};
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
                            withCredentials: true
                        },
                        get: {
                            method: 'GET',
                            withCredentials: true
                        }
                    }
                );
            });
            return resources;
        }]
    });
