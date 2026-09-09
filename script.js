function order(productName, price) {
    const phoneNumber = '2349016412919';
    const message = `I would like to order ${productName} for N${price}.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}