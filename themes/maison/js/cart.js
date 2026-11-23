/*
 * Shopping bag for a Vanilla Gorilla salon theme.
 * No dependencies. The bag is kept in localStorage, in this browser only.
 *
 * Markup that this script uses:
 *   [data-add-to-cart]   a button with data-id, data-name, data-price (a number) and data-image
 *   [data-cart-toggle]   opens the bag
 *   [data-cart-count]    shows the number of items
 *   #cart-drawer         the <dialog>; see templates/footer.html for the checkout setting
 */
(function () {
    'use strict';

    var KEY = 'vg-cart';
    var drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    var list = drawer.querySelector('[data-cart-items]');
    var emptyMessage = drawer.querySelector('[data-cart-empty]');
    var footer = drawer.querySelector('[data-cart-footer]');
    var subtotal = drawer.querySelector('[data-cart-subtotal]');
    var checkout = drawer.querySelector('[data-cart-checkout]');
    var note = drawer.querySelector('[data-cart-note]');
    var checkoutUrl = (drawer.dataset.checkoutUrl || '').trim();
    var checkoutEmail = (drawer.dataset.checkoutEmail || '').trim();
    var money = new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency: drawer.dataset.currency || 'USD'
    });

    var items = read();

    function read() {
        try {
            var saved = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(saved) ? saved.filter(function (item) {
                return item && typeof item.id === 'string' && item.quantity > 0 && isFinite(item.price);
            }) : [];
        } catch (error) {
            return [];
        }
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(items));
        } catch (error) {
            /* Storage is not available. The bag still works until the page closes. */
        }
    }

    function count() {
        return items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    }

    function total() {
        return items.reduce(function (sum, item) { return sum + item.quantity * item.price; }, 0);
    }

    function element(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function quantityButton(label, text, id, change) {
        var button = element('button', 'cart-qty-button', text);
        button.type = 'button';
        button.setAttribute('aria-label', label);
        button.addEventListener('click', function () { setQuantity(id, change); });
        return button;
    }

    function render() {
        var itemCount = count();
        document.querySelectorAll('[data-cart-count]').forEach(function (node) {
            node.textContent = itemCount;
        });
        document.querySelectorAll('[data-cart-toggle]').forEach(function (node) {
            node.setAttribute('aria-label', 'Open bag, ' + itemCount + (itemCount === 1 ? ' item' : ' items'));
        });

        list.textContent = '';
        items.forEach(function (item) {
            var row = element('li', 'cart-item');
            if (item.image) {
                var image = element('img', 'cart-item-image');
                image.src = item.image;
                image.alt = '';
                row.appendChild(image);
            }
            var body = element('div', 'cart-item-body');
            body.appendChild(element('p', 'cart-item-name', item.name));
            body.appendChild(element('p', 'cart-item-price', money.format(item.price)));

            var quantity = element('div', 'cart-qty');
            quantity.appendChild(quantityButton('Remove one ' + item.name, '−', item.id, -1));
            quantity.appendChild(element('span', 'cart-qty-value', item.quantity));
            quantity.appendChild(quantityButton('Add one ' + item.name, '+', item.id, 1));
            body.appendChild(quantity);
            row.appendChild(body);

            var remove = element('button', 'cart-remove', 'Remove');
            remove.type = 'button';
            remove.setAttribute('aria-label', 'Remove ' + item.name + ' from bag');
            remove.addEventListener('click', function () { setQuantity(item.id, -item.quantity); });
            row.appendChild(remove);
            list.appendChild(row);
        });

        emptyMessage.hidden = items.length > 0;
        footer.hidden = items.length === 0;
        subtotal.textContent = money.format(total());
    }

    function setQuantity(id, change) {
        items = items.map(function (item) {
            return item.id === id ? Object.assign({}, item, { quantity: item.quantity + change }) : item;
        }).filter(function (item) { return item.quantity > 0; });
        save();
        render();
    }

    function add(button) {
        var id = button.dataset.id;
        var price = parseFloat(button.dataset.price);
        if (!id || !isFinite(price)) return;
        var existing = items.find(function (item) { return item.id === id; });
        if (existing) {
            existing.quantity += 1;
        } else {
            /* Keep the image address absolute so that it works from each page depth. */
            var image = button.dataset.image ? new URL(button.dataset.image, document.baseURI).href : '';
            items.push({ id: id, name: button.dataset.name || id, price: price, image: image, quantity: 1 });
        }
        save();
        render();
        open();
    }

    function open() {
        if (!drawer.open) drawer.showModal();
    }

    function orderText() {
        var lines = items.map(function (item) {
            return item.quantity + ' x ' + item.name + ' (' + money.format(item.price) + ')';
        });
        lines.push('', 'Subtotal: ' + money.format(total()));
        return lines.join('\n');
    }

    if (checkoutUrl) {
        checkout.textContent = 'Go to checkout';
        if (note) note.hidden = true;
    } else if (!checkoutEmail) {
        checkout.hidden = true;
    }

    checkout.addEventListener('click', function () {
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        } else if (checkoutEmail) {
            window.location.href = 'mailto:' + checkoutEmail +
                '?subject=' + encodeURIComponent('Order request') +
                '&body=' + encodeURIComponent('Hello,\n\nI would like to order:\n\n' + orderText() + '\n\nThank you.');
        }
    });

    document.addEventListener('click', function (event) {
        var target = event.target.closest('[data-add-to-cart], [data-cart-toggle], [data-cart-close]');
        if (!target) {
            /* A click on the backdrop closes the bag. */
            if (event.target === drawer) drawer.close();
            return;
        }
        if (target.matches('[data-add-to-cart]')) add(target);
        else if (target.matches('[data-cart-toggle]')) open();
        else drawer.close();
    });

    /* Keep two open tabs in step. */
    window.addEventListener('storage', function (event) {
        if (event.key === KEY) {
            items = read();
            render();
        }
    });

    render();
})();
