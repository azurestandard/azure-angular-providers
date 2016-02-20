azure-angular-providers is an [Azure Standard API][api] provider for
[AngularJS][].

Configuration
=============

The only configrable option is currently the base URL for the
`AzureAPI` interface.  The default URL is
`https://api.azurestandard.com`, but you can adjust that URL for
testing with something like:

    angular.module('yourModule', ['your', 'dependencies'])
      .config(function(AzureAPIProvider) {
        AzureAPIProvider.setUrl('https://example.com/your/testing/api');
      });

In a similar configuration block, you can update the Algolia
connection information:

    AzureAPIProvider.setAlgoliaAppId('your-application-id');
    AzureAPIProvider.setAlgoliaApiKey('your-API-key');

If you don't set both of these, no Algolia indexes will be attached to
your $resources.  To attach an [`.algolia` index
attribute](#algolia-search) to a particular $resource, add an entry
mapping the model name to your Algolia index name:

    AzureAPIProvider.setAlgoliaIndexNames({
        'drop': 'my-drop-index',
        'route': 'routes',
    })'

By default, indexes are provided for the following models:

* brand
* category
* drop
* product

Where the default index name is just the plural model name
(e.g. “categories”).  Entries passed to `setAlgoliaIndexNames` are
added to the default list, so the example above changes the drop index
and adds a route index, but leaves the category, etc., indexes with
their default values.

AzureAPI
========

The basic API has an Angular [$resource][resource] for each API model.
Currently supported models:

* account-entry
* address
* brand
* category
* drop
* favorite
* faq
* notification
* notification-dismissal
* order
* order-line
* payment-method
* packaged-product
* packaged-product-tag
* packaged-product-tag-association
* person
* pickup
* product
* purchase-order
* route
* route-stop
* stop
* trip

Each model currently supports the following actions:

* query
* count
* create, except for the following models:
  * packaged-product-tag
* get, except for the following models:
  * packaged-product-tag
  * packaged-product-tag-association
* save, except for the following models:
  * packaged-product-tag
  * packaged-product-tag-association
* delete, except for the following models:
  * packaged-product-tag

with the usual Angular $resource semantics, except that `create`
creates new instances while `save` updates existing instances.  For
example:

    var you = AzureAPI.person.get();
    var person = AzureAPI.person.get({id: 123});
    var product = AzureAPI.product.get(code='SC065', function() {
      product.description = 'Delicious!';
      product.$save();
    });
    var favorites = AzureAPI.product.query({'filter-person': you.id});
    var order = AzureAPI.order.create({
      customer: you,
      status: 'cart',
      drop: 456,
      trip: 789,
    });
    AzureAPI.category.delete({id: 135});

In addition, a few models support the following actions:

* mail, for contacting associated customers.  Supported models:
  route, trip.
* mails, for contacting customers associated with multiple entities
  using a single API call.  For example, you can mail several people
  with a single call to `AzureAPI.person.mails(…)`.  Supported models:
  person.

The packaged-product model supports the following actions:

* addCategory, which takes `code` and `categoryId` parameters to
  associate the packaged product with the given category.
* removeCategory, which takes `code` and `categoryId` parameters to
  dissociate the packaged product with the given category.

The drop model also supports the following action:

* locations, which returns an array of all active drops with name and
  location for map display.

Algolia search
--------------

If you've [configured the Algolia client](#configuration), the [Algolia
client](https://github.com/algolia/algoliasearch-client-js) will be available 
as `AzureAPI.algolia()`. In addition, models listed in `algoliaIndexNames`
will have an initialized index attached as the `.algolia` property. For
example, with the earlier [configuration examples](#configuration), you could
use:

    AzureAPI.category.algolia.search(…);
    AzureAPI.drop.algolia.search(…);
    AzureAPI.route.algolia.search(…);
    …

See [Algolia's documentation][algolia-search] for more information.

Count
-----

The `count` action isn't one of Angular's standards.  It hits the same
endpoint as the `query` action, but instead of returning an array of
matching items, it returns a $resource whose `count` property is the
number of possible items matching your query (how many you'd get in a
`query` that didn't set `limit`).  Use it with controller code like:

    $scope.favoritesCount = AzureAPI.product.count({
      'filter-person': person.id
    });

and template code like:

    You have {{favoritesCount.count}} favorites.

Other methods
-------------

There's also:

* `AzureAPI.session.get()` to get information about your existing
  session (e.g. whether it's anonymous or not).
* `AzureAPI.login({username: ..., password: ...})` to start an
  authenticated session.  It returns an [HttpPromise][] for a session
  object.
* `AzureAPI.logout()` to leave an authenticated session.  It returns
  an [HttpPromise][] for an unauthenticated session object.
* `AzureAPI.register({'base-url': ..., person: ..., address: ...,
  telephone: ..., drop: ...})` to register a new user. It returns an
  [HttpPromise][] for an object containing the resend token.
* `AzureAPI.activate({token: ...})` to activate a registration using
  the confirmation token (which was emailed to the registrant, and is
  different from the resend token returned by `AzureAPI.register`). It
  returns an [HttpPromise][] for a the activated person object.
* `AzureAPI.resendConfirmationEmail({token: ..., 'base-url': ...})` to
  resend the confirmation email to the user with the given resend
  token. It returns an [HttpPromise][] for a 204 response.

AzureCategory
=============

Use the `AzureCategory` factory to show a category's position in the
hierarchy.  Calling:

    AzureCategory(categoryId)

will return an `Category` instance with the following properties:

* `ancestors`, an array of category objects starting with the leaf
  category and working down to the root category.
* `category`, the leaf category (which is also in the `ancestors`
  array).
* `path(category)`, a method for converting a category from
  `ancestors` (or that category's ID) into a slug path.  Called
  without arguments, `path()` will default to the path for the leaf
  category.
* `children()`, a method returning an array of `Category` instances
  for child categories (sorted by name).  The array has the following
  additional properties:
    * `$promise`, with a promise that's resolved after the array is
      fully populated.
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

    AzureProduct(productId)

will return an `Product` instance with the following properties:

* `product`, the data for the project as returned from the API.
* `packaging`, an array of `PackagedProduct` instances with the
  various packaging options for the product.
* `packaged`, the currently selected `PackagedProduct` (which is also
  in the `packaging` array).
* `code`, the code for the currently selected packaged product, which
  is mostly useful as a value for [ng-model on select widgets][select]
  and the like to avoid accidentally editing `packaged.code`.
* `selectPackaging(packagedProductCode)`, a method for changing the
  currently selected packaged product (selection will not persist
  beyond page refreshes).  Calling with a falsy argument will select
  the product's cheapest packaging.
* `$promise`, a promise that resolves with the `product` $resource
  after the `Product` setup completes.

The `PackagedProduct` instances have the following properties:

* `packaged`, the data for the packaged-project as returned from the
  API.
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
* A packaged-product object (or any object with the packaged-product
  code stored in the `code` property).  In this case, you may want to
  pass an additional object with query parameters:

        AzureProduct(packagedProduct, {tag: 'new-not-on-sale'});

  to ensure your packaged product is included in the query results.

AzureOrderLine
==============

Use the `AzureOrderLine` factory to wrap an order-line resource
with additional properties. Calling:

    new AzureOrderLine(orderLine)

will return an `OrderLine` instance with the following properties:

* `orderLine`, the order-line object as returned by
  `AzureAPI['order-line'].get(…)`.
* `product`, the `Product` instance associated with the line
  (`orderLine['packaged-product']` is just the product's code).  See
  `AzureProduct` for details on this class.

AzureOrder
==========

Use the `AzureOrder` factory to wrap an order resource with
additional properties. Calling:

    new AzureOrder(order)

will return an `Order` instance with the following properties:

* `order`, the order object as returned by `AzureAPI.order.get(…)`.
* `orderLines`, an array of `OrderLine` instances wrapping order-line
  $resources with the requested products, quantities, prices, ….
* `price`, the total price of all order-lines.
* `products`, a count of all the products on the order.
* `shipping`, the shipping amount in dollars.
* `volume`, the total volume of all products on the order.
* `weight`, the total weight of all products on the order.

For orders that have been placed, the `Order` instance will have
the additional property:

* `payment`, the payment the customer used for the order.

For orders scheduled for delivery on a drop and trip,
the `Order` instance will have the additional properties:

* `contact`, the primary contact for this drop.
* `drop`, the drop to which the customer wants the order delivered.
* `stop`, the stop on which the customer's order will be delivered.
* `trip`, the trip on which the customer's order will be delivered.

Each of those fields is a $resource (e.g. so they have the usual
`$promise`) attribute.

The `AzureOrder` factory also adds the following properties to each
`OrderLine` instance:

* `total-quantity-ordered`, the sum of `quantity-ordered` across
  all order-lines of the same `packaged-product`.
* `total-quantity-shipped`, the sum of `quantity-shipped` across
  all order-lines of the same `packaged-product`.

AzureOrders
===========

Use the `AzureOrders` factory to create an `Orders` instance. Calling:

    AzureOrders(personId)

will return a reference to that person's `Orders` instance
with the following properties:

* 'orders', an array of `Order` instances, past and present.
  See `AzureOrder` for details on the `Order` class.

AzureCarts
==========

Use the `AzureCarts` factory to manage a customer's carts.  Calling:

    AzureCarts(personId)

will return a reference to that person's singleton `Carts` instance
with the following properties:

* `carts`, an array of `Cart` instances that the customer has in
  progress.
* `cart`, the currently selected `Cart` (which is also in the `carts`
  array).
* `selectCart(orderId)`, a method for changing the current default
  cart (selection will not persist beyond page refreshes).
* `createCart(order[, select])`, a method for creating a new cart.
  The `order` argument can be either an `AzureAPI.order` $resource or
  an object containing the data to be used for a new `AzureAPI.order`
  $resource (in which case `createCart` will create the order
  $resource internally).  If `select` is truthy, the new cart will be
  selected as the current default cart.  The method returns a promise
  that resolves after the the cart is created, so you can do things
  like:

        carts.CreateCart(…).then(function(cart) {…});

* `findCart(parameters)`, a method that returns the cart who's value
  is a subset of `parameters` and throws an `Error` if no match is
  found.  For example:

        carts.findCart({order: {drop: 5}})

  will look for the first cart where `cart.order.drop === 5`.

The `Cart` instance subclasses `AzureOrder` and has the additional
property:

* `addLine(productCode, quantityOrdered)`, a method to add an
  order-line to the order and update the associated state.

The `OrderLine` instances subclass `AzureOrderLine` and have the
additional properties:

* `save`, a method wrapping `orderLine.$save()` that clears fields
  customers shouldn't be setting (currently `price` and `weight`).
* `delete`, a method wrapping `orderLine.$delete()` that also removes
  the line from the `orderLines` list on the associated `Cart`.
* `increment`, a method that increases the ordered quantity by one.
* `decrement`, a method that decreases the ordered quantity by one if
  the ordered quantity was greater than one.  If the ordered quantity
  was less than or equal to one, this is a no-op.
* `cart`, the `Cart` that the order belongs to.

AzureLocalCarts
===============

Use the `AzureLocalCarts` factory to manage an anonymous cart.  Calling:

    AzureLocalCarts()

`AzureLocalCarts` exposes the same interface as `AzureCarts` minus the
following properties:

* `carts`
* `selectCart()`
* `createCart()`
* `findCart()`

The `OrderLine` instances subclass `AzureOrderLine` minus the following
property:

* `save`

Examples
========

See the [demo page][demo] for a brief example.

[algolia-search]: https://www.algolia.com/doc/javascript#search
[api]: https://github.com/azurestandard/api-spec
[AngularJS]: https://angularjs.org/
[resource]: https://docs.angularjs.org/api/ngResource/service/$resource
[HttpPromise]: https://docs.angularjs.org/api/ng/service/$http#general-usage
[promise]: https://docs.angularjs.org/api/ng/service/$q#the-promise-api
[select]: https://docs.angularjs.org/api/ng/directive/select
[demo]: example.html
