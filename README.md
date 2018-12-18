azure-angular-providers is an [Azure Standard API][api] provider for
[AngularJS][angularjs].

# Configuration

The only configrable option is currently the base URL for the
`AzureAPI` interface. The default URL is
`https://api.azurestandard.com`, but you can adjust that URL for
testing with something like:

```js
angular.module('yourModule', ['your', 'dependencies']).config(function(AzureAPIProvider) {
    AzureAPIProvider.setUrl('https://example.com/your/testing/api');
});
```

# AzureAPI

The basic API has an Angular [$resource][resource] for each API model.
Currently supported models:

-   account-entry
-   address
-   affiliate-referral
-   audit-product
-   bartender-host
-   bartender-print-configuration
-   bartender-template
-   brand
-   category
-   country
-   drop
-   drop-membership
-   email
-   favorite
-   faq
-   notification
-   notification-dismissal
-   order
-   order-fee
-   order-frequency-segment
-   order-line
-   payment
-   payment-method
-   packaged-product
-   packaged-product-tag
-   packaged-product-tag-association
-   person
-   pickup
-   printer
-   product
-   purchase
-   region
-   reward
-   route
-   route-stop
-   stop
-   trip
-   warehouse

Each model currently supports the following actions:

-   query
-   count
-   create, except for the following models:
    -   affiliate-referral
    -   packaged-product-tag
    -   reward
-   get, except for the following models:
    -   affiliate-referral
    -   packaged-product-tag
    -   packaged-product-tag-association
-   save, except for the following models:
    -   affiliate-referral
    -   packaged-product-tag
    -   packaged-product-tag-association
    -   reward
-   delete, except for the following models:
    -   affiliate-referral
    -   packaged-product-tag
    -   reward

with the usual Angular $resource semantics, except that `create`
creates new instances while `save` updates existing instances. For
example:

```js
var you = AzureAPI.person.get();
var person = AzureAPI.person.get({ id: 123 });
var product = AzureAPI.product.get((code = 'SC065'), function() {
    product.description = 'Delicious!';
    product.$save();
});
var favorites = AzureAPI.product.query({ 'filter-person': you.id });
var order = AzureAPI.order.create({
    customer: you,
    status: 'open',
    drop: 456,
    trip: 789
});
AzureAPI.category.delete({ id: 135 });
```

In addition, a few models support the following actions:

-   mail, for contacting associated customers. Supported models:
    route, trip.
-   mails, for contacting customers associated with multiple entities
    using a single API call. For example, you can mail several people
    with a single call to `AzureAPI.person.mails(…)`. Supported models:
    person.

The packaged-product model supports the following actions:

-   addCategory, which takes `code` and `categoryId` parameters to
    associate the packaged product with the given category.
-   removeCategory, which takes `code` and `categoryId` parameters to
    dissociate the packaged product with the given category.
-   old, which gets a packaged-product using the old `id`

The person model supports the following action:

-   findAffiliateCodeByMarketingSlug, which takes `marketing-slug` and
    returns the `affiliate-code` of the person with that marketing slug.

The drop model also supports the following action:

-   locations, which returns an array of all active drops with name and
    location for map display.

The bartender-print-configuration model supports the following action:

-   testPrint({ stock: ... }), which creates a test BarTender print request
    using the given print configuration. The print request uses hard-coded
    dummy data if a stock ID is not provided.

## Count

The `count` action isn't one of Angular's standards. It hits the same
endpoint as the `query` action, but instead of returning an array of
matching items, it returns a $resource whose `count` property is the
number of possible items matching your query (how many you'd get in a
`query` that didn't set `limit`). Use it with controller code like:

```js
$scope.favoritesCount = AzureAPI.product.count({
    'filter-person': person.id
});
```

and template code like:

    You have {{favoritesCount.count}} favorites.

## Other methods

There's also:

-   `AzureAPI.session.get()` to get information about your existing
    session (e.g. whether it's anonymous or not).
-   `AzureAPI.login({username: ..., password: ...})` to start an
    authenticated session. It returns an [HttpPromise][httppromise] for a session
    object.
-   `AzureAPI.logout()` to leave an authenticated session. It returns
    an [HttpPromise][httppromise] for an unauthenticated session object.
-   `AzureAPI.register({'base-url': ..., email: ..., person: ..., address: ..., telephone: ..., drop: ..., catalog: ...})` to register
    a new user. It returns an [HttpPromise][httppromise] for an object containing
    the resend token and a session object. If a new user was created,
    the session object will have a person property and the response will
    authenticate the user.
-   `AzureAPI.resendRegistrationEmail({token: ..., 'base-url': ...})` to
    resend the registration email to the user with the given resend
    token. It returns an [HttpPromise][httppromise] for a 204 response.
-   `AzureAPI.resetPassword({email: ..., 'base-url': ...})` to
    send a password-reset confirmation email to the user.
-   `AzureAPI.resetPasswordConfirm({token: ..., password: ...})` to
    reset a password using a confirmation token.

# Examples

See the [demo page][demo] for a brief example.

[api]: https://github.com/azurestandard/api-spec
[angularjs]: https://angularjs.org/
[resource]: https://docs.angularjs.org/api/ngResource/service/$resource
[httppromise]: https://docs.angularjs.org/api/ng/service/$http#general-usage
[promise]: https://docs.angularjs.org/api/ng/service/$q#the-promise-api
[select]: https://docs.angularjs.org/api/ng/directive/select
[demo]: example.html
