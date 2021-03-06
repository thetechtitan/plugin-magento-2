/*browser:true*/
/*global define*/

define([
  "jquery",
  "Magento_Checkout/js/view/payment/default",
  "Magento_Checkout/js/action/place-order",
  "Magento_Checkout/js/model/payment/additional-validators",
  "Magento_Checkout/js/model/quote",
  "Magento_Checkout/js/model/full-screen-loader",
  "Magento_Checkout/js/action/redirect-on-success",
  "Pstk_Paystack/js/paystack-inline"
], function(
  $,
  Component,
  placeOrderAction,
  additionalValidators,
  quote,
  fullScreenLoader,
  redirectOnSuccessAction
) {
  "use strict";



    return Component.extend({
      defaults: {
        template: "Pstk_Paystack/payment/form",
        customObserverName: null
      },

      redirectAfterPlaceOrder: false,


    initialize: function() {
      this._super();
      // Add Paystack Gateway script to head /// REPLACED USING REQUIRE.JS
      return this;
    },
     
      getCode: function() {
        return "pstk_paystack";
      },

      getData: function() {
        return {
          method: this.item.method,
          additional_data: {}
        };
      },

      isActive: function() {
        return true;
      },

      /**
       * @override
       */
      afterPlaceOrder: function() {
        var checkoutConfig = window.checkoutConfig;
        var paymentData = quote.billingAddress();
        var paystackConfiguration = checkoutConfig.payment.pstk_paystack;


      if (checkoutConfig.isCustomerLoggedIn) {
        var customerData = checkoutConfig.customerData;
        paymentData.email = customerData.email;
      } else {
       var storageData = JSON.parse(
        localStorage.getItem("mage-cache-storage")
        )["checkout-data"];
        paymentData.email = storageData.validatedEmailValue;
      }


        var quoteId = checkoutConfig.quoteItemData[0].quote_id;


      var _this = this;
      _this.isPlaceOrderActionAllowed(false);
      var handler = PaystackPop.setup({
        key: paystackConfiguration.public_key,
        email: paymentData.email,
        amount: Math.ceil(quote.totals().grand_total * 100), // get order total from quote for an accurate... quote
        phone: paymentData.telephone,
        currency: checkoutConfig.totalsData.quote_currency_code,
        metadata: {
          quoteId: quoteId,
          custom_fields: [
            {
              display_name: "QuoteId",
              variable_name: "quote id",
              value: quoteId
            },
            {
              display_name: "Address",
              variable_name: "address",
              value: paymentData.street[0] + ", " + paymentData.street[1]
            },
            {
              display_name: "Postal Code",
              variable_name: "postal_code",
              value: paymentData.postcode
            },
            {
              display_name: "City",
              variable_name: "city",
              value: paymentData.city + ", " + paymentData.countryId
            }
          ]
        },
        callback: function(response) {

          $.ajax({
            method: "GET",
            url:paystackConfiguration.ver_url +"ver/page/view",
            data:{
                ref:response.reference
              },
              complete: function(response){
                console.log(response);
              var text = response.responseJSON.message;
              alert("Payment Successful !");
              // redirect to success page after
              if(text==="Transaction was successful")
            redirectOnSuccessAction.execute();

              },
                error: function (xhr, status, errorThrown) {
                    console.log('Error happens. Try again. Code: '+status);
                }

          });

        }
      });
      handler.openIframe();
    }
  });
});


