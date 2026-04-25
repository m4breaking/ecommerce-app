import { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse our products, add items to your cart, and proceed to checkout. Fill in your shipping and payment information, then confirm your order. You will receive an order confirmation email.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Cash on Delivery (COD), Credit/Debit Cards, bKash, and Bank Transfers. Choose your preferred payment method during checkout.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Delivery times vary by location. Typically, orders are delivered within 3-5 business days for major cities and 5-7 business days for other areas. You can track your order status in your account.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'Yes, you can cancel your order before it is shipped. Go to your Orders page and click on the order you wish to cancel. If the order has already been shipped, please contact our customer support.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery for most products. Items must be unused and in their original packaging. Please visit our Return Policy page for detailed information.'
    },
    {
      question: 'How do I track my order?',
      answer: 'Log in to your account and visit the Orders page. You will see the current status of your order with a visual timeline showing progress from pending to delivery.'
    },
    {
      question: 'Do you offer discounts or coupons?',
      answer: 'Yes! We regularly offer discount codes and coupons. Check our homepage for current promotions, or sign up for our newsletter to receive exclusive offers.'
    },
    {
      question: 'Can I change my shipping address after placing an order?',
      answer: 'Address changes are only possible before the order is shipped. Please contact our customer support immediately if you need to change your shipping address.'
    },
    {
      question: 'What if I receive a damaged or wrong item?',
      answer: 'If you receive a damaged or incorrect item, please contact us within 24 hours of delivery. We will arrange for a replacement or refund at no additional cost to you.'
    },
    {
      question: 'How do I use a coupon code?',
      answer: 'During checkout, enter your coupon code in the designated field and click "Apply Coupon". The discount will be automatically applied to your order total if the code is valid.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">Find answers to common questions about our products, services, and policies.</p>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6 border border-indigo-100 dark:border-indigo-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Still have questions?</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Can't find the answer you're looking for? Please contact our customer support team.
        </p>
        <div className="flex space-x-4">
          <a
            href="/contact"
            className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Contact Us
          </a>
          <button
            onClick={() => {
              const chatButton = document.querySelector('button[class*="fixed bottom-6 right-6"]');
              if (chatButton) chatButton.click();
            }}
            className="inline-block bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-md border border-indigo-600 dark:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-600"
          >
            Start Live Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
