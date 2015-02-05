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
* count
* get

with the usual Angular $resource semantics.  For example:

    var you = AzureAPI.person.get();
    var person = AzureAPI.person.get({id: 123});
    var product = AzureAPI.product.get(code='SC065');
    var favorites = AzureAPI.product.query({person: you.id});

Count
-----

The `count` action isn't one of Angular's standards.  It hits the same
endpoint as the `query` action, but instead of returning an array of
matching items, it returns a $resource whose `count` property is the
number of possible items matching your query (how many you'd get in a
`query` that didn't set `limit`).  Use it with controller code like:

    $scope.favorites_count = AzureAPI.product.count({person: person.id});

and template code like:

    You have {{favorites_count.count}} favorites.

Other methods
-------------

There's also:

* `AzureAPI.session.get()` to get information about your existing
  session (e.g. whether it's anonymous or not).
* `AzureAPI.login(username, password)` to start an authenticated
  session.  It returns an [HttpPromise][].

AzureCategory
=============

Use the `AzureCategory` factory to show a category's position in the
hierarchy.  Calling:

    AzureCategory(category_id)

will return a *new* `Category` instance with the following properties:

* `ancestors`, an array of category objects starting with the leaf
  category and working down to the root category.
* `category`, the leaf category (which is also in the `ancestors`
  array).
* `path(category)`, a method for converting a category from
  `ancestors` (or that category's ID) into a slug path.  Called
  without arguments, `path()` will default to the path for the leaf
  category.
* `children()`, a method returning an array of `Category` instances
  for child categories (sorted by name).
* `$promise`, an object with promises for data that may be filled in
  on the fly.  Keys:
    * `category`, resolves to `Category.category` when we set that
      field.

The underlying category objects and children returned by the API are
cached in the factory, so a new `Category` instance will not need to
hit the API again to download category information that is already in
the cache.

Besides using a category ID as the argument to `AzureCategory`, you
can also use:

* A category object (or any object with the category ID stored in the
  `id` property).  The category object is added to the cache, which
  may save a network lookup for previously uncached IDs.
* A category path string (e.g. `healthy-foods/bulk/chocolate-carob`).
  In this case, `AzureCategory` will return a [promise][], because
  resolving the path into a category object may require network
  lookups for uncached categories.  Successful promises will resolve
  with `Category` instances.

AzureProduct
============

Use the `AzureProduct` factory to manage a product with different
packaging (e.g. “2.7 ozs.” and “12 x 2.7 ozs.”).  Calling:

    AzureProduct(product_code)

will return a *new* `Product` instance with the following properties:

* `products`, an array of product objects with the various packaging
  versions of the requested product.
* `product`, the currently selected product (which is also in the
  `products` array).
* `code`, the currently selected product's code, which is mostly
  useful as a value for [ng-model on select widgets][select] and the
  like to avoid accidentally editing `product.code`.
* `selectPackaging(product_code)`, a method for changing the currently
  selected packaging (selection will not persist beyond page
  refreshes).
* `categories()`, a method returning an array of `AzureCategory`
  instances for each category associated with this product.
* `primaryCategory()`, a method returning the primary `AzureCategory`
  associated with this product.

The underlying product objects returned by the API are cached in the
factory, so a new `Product` instance will not need to hit the API
again to download product information that is already in the cache.

Besides using a product ID as the argument to `AzureProduct`, you
can also use:

* A product object (or any object with the product ID stored in the
  `id` property).  The product object is added to the cache, which may
  save a network lookup for previously uncached IDs.

AzureCarts
==========

Use the `AzureCarts` factory to manage a customer's carts.  Calling:

    AzureCarts(person_id)

will return a reference to that person's singleton `Carts` instance
with the following properties:

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
    * `productClass`, the `Product` instance associated with the line
      (`product` is just the product's code).  See `AzureProduct` for
      details on this class.
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
[HttpPromise]: https://docs.angularjs.org/api/ng/service/$http#general-usage
[promise]: https://docs.angularjs.org/api/ng/service/$q#the-promise-api
[select]: https://docs.angularjs.org/api/ng/directive/select
[demo]: example.html
