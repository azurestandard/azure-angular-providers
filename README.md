azure-angular-providers is an [Azure Standard API][api] provider for
[AngularJS][].

AzureAPI
========

The basic API has an Angular [$resource][resource] for each API model.
Currently supported models:

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

AzureCarts
==========

Use the `AzureCarts` factory to manage a customer's carts.  Given a
person's ID, the factory returns a `Carts` instance with the following
properties:

* `carts`, an array of `Cart` instances that the customer has in
  progress.
* `cart`, the currently selected `Cart` (which is also in the `carts`
  array).
* `selectCart(order_id)`, a method for changing the current default
  cart (selection will not persist beyond page refreshes).

The `Cart` instances have the following properties:

* `order`, the order object as returned by `AzureAPI.order.get(…)`.
* `orderLines`, an array of order-line objects recording requested
  products, quantities, prices, ….  In addition to their usual
  properties, the order-line objects will have:
    * `totalPrice`, the total current price for the line in dollars.
    * `productObject`, the product object associated with the line
      (`product` is just the product's code).
* `price`, the total current price of the order.
* `weight`, the total weight of all products on the order.
* `products`, a count of all the products on the order.

For orders scheduled for delivery by a trip, the `Cart` instance will
have the additional properties:

* `drop`, the drop to which the customer wants the order delivered.
* `trip`, the trip on which the customer wants the order delivered.

Examples
========

See the [demo page][demo] for a brief example.

[api]: https://github.com/azurestandard/api-spec
[AngularJS]: https://angularjs.org/
[resource]: https://docs.angularjs.org/api/ngResource/service/$resource
[demo]: example.html
