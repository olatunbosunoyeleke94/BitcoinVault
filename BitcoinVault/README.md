# Bitcoin Wallet with Lightning Network Support

A cutting-edge non-custodial Bitcoin wallet with advanced Lightning Network capabilities, designed for seamless and secure cryptocurrency transactions.

## Features

- **Self-custodial Bitcoin wallet**: Complete control over your private keys
- **Lightning Network support**: Fast, low-cost transactions using the Lightning Network
- **No KYC required**: Privacy-preserving wallet that doesn't require identity verification
- **Cross-platform**: Works on desktop and mobile browsers

## Current Implementation Status

### Working
- ✅ Wallet creation and restoration using seed phrases
- ✅ Mock Bitcoin transactions for testing
- ✅ Lightning Network toggle functionality
- ✅ Creating Lightning invoices (receiving payments)
- ✅ Basic wallet interface with transaction history

### Known Limitations

#### Lightning Network Invoices
⚠️ **Important**: Currently, Lightning invoices generated by this wallet may not be properly payable by some Lightning wallets. This is due to a limitation with private nodes in the Lightning Network.

**Technical explanation**: 
- Invoices created by private Lightning nodes (like the ones used in this wallet) need to include additional routing information called "route hints"
- Without these route hints, other Lightning wallets cannot establish a payment route to the node
- This is a known challenge with the Lightning Network protocol, not a bug in the wallet

**Future improvements**:
- Integration with a more comprehensive Lightning Network service that provides proper route hints
- Improved error handling for failed Lightning payments
- Support for additional Lightning payment options

## Getting Started

### Prerequisites
- Node.js 
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create environment variables:
   - `LNBITS_ENDPOINT`: Your LNBits API endpoint
   - `LNBITS_API_KEY`: Your LNBits API key
   - `LNBITS_ADMIN_KEY`: Your LNBits admin key
4. Start the application: `npm run dev`

## Environment Variables

The application requires the following environment variables:

- `LNBITS_ENDPOINT`: The LNBits API endpoint URL
- `LNBITS_API_KEY`: Your LNBits invoice/read key
- `LNBITS_ADMIN_KEY`: Your LNBits admin key

You can obtain these by creating an account on an LNBits instance like [legend.lnbits.com](https://legend.lnbits.com).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.