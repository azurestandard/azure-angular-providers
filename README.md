azure-angular-providers is an [Azure Standard API][api] provider for
[AngularJS][].  The basic API has an Angular [$resource][resource] for
each API model.  Currently supported models:

* brand
* category
* drop
* order
* order-line
* person
* product
* route
* trip

Each model currently supports the following actions:

* query
* get

with the usual Angular $resource semantics.  For example:

    var you = AzureAPI.person.get();
    var person = AzureAPI.person.get(id=123);
    var product = AzureAPI.product.get(code='SC065');
    var favorites = AzureAPI.product.query({person: you.id});

See the [demo page][demo] for a brief example.

[api]: https://github.com/azurestandard/api-spec
[AngularJS]: https://angularjs.org/
[resource]: https://docs.angularjs.org/api/ngResource/service/$resource
[demo]: example.html
