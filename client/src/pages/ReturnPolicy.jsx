const ReturnPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Return & Refund Policy</h1>
      <p className="text-gray-600 mb-8">Last updated: April 2026</p>

      <div className="space-y-8">
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Policy</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              We want you to be completely satisfied with your purchase. If you're not happy with your order, you may return eligible items within 7 days of delivery.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Items must be unused and in their original packaging</li>
              <li>Original receipt or proof of purchase is required</li>
              <li>Return shipping costs are the customer's responsibility unless the item is defective</li>
              <li>Some items are non-returnable (personalized items, intimate apparel, etc.)</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Initiate a Return</h2>
          <div className="space-y-3 text-gray-600">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Contact our customer support team via live chat or email</li>
              <li>Provide your order number and the item(s) you wish to return</li>
              <li>Our team will review your request and provide a return authorization</li>
              <li>Package the item securely in its original packaging</li>
              <li>Ship the item to the address provided by our team</li>
              <li>Once received, we will inspect the item and process your refund</li>
            </ol>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Process</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              Refunds are processed within 5-7 business days after we receive and inspect your returned item. The refund will be credited to your original payment method.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">Please Note:</p>
              <p className="text-yellow-700 text-sm mt-1">
                Your bank or credit card company may take additional time to post the refund to your account.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exchanges</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              We offer exchanges for items of equal or greater value. If you'd like to exchange for a higher-priced item, you'll need to pay the difference. For lower-priced items, the difference will be refunded.
            </p>
            <p>
              To request an exchange, please follow the same return process and specify the item you'd like instead.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Damaged or Defective Items</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              If you receive a damaged or defective item, please contact us within 24 hours of delivery. We will arrange for a free replacement or full refund at no additional cost to you.
            </p>
            <p>
              Please include photos of the damage when contacting us to expedite the process.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Non-Returnable Items</h2>
          <div className="space-y-3 text-gray-600">
            <p>The following items cannot be returned:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Personalized or custom-made items</li>
              <li>Intimate apparel (underwear, swimwear)</li>
              <li>Perishable items</li>
              <li>Items marked as "Final Sale"</li>
              <li>Gift cards</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              If you have any questions about our return policy or need assistance with a return, please don't hesitate to contact us.
            </p>
            <div className="flex space-x-4">
              <a
                href="/contact"
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Contact Support
              </a>
              <button
                onClick={() => {
                  const chatButton = document.querySelector('button[class*="fixed bottom-6 right-6"]');
                  if (chatButton) chatButton.click();
                }}
                className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-md border border-indigo-600 hover:bg-indigo-50"
              >
                Start Live Chat
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReturnPolicy;
