import Stripe from 'stripe';
import config from './index';

// Stripe SDK instance in test mode
export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2023-10-16',
});

export default stripe;
