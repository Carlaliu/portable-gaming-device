import { inject } from '@vercel/analytics';
import './console/core';
import './console/pwa';

// Vercel Web Analytics: page views plus the custom events sent through track() (see README)
inject();
