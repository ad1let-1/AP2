import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageTransition from '../components/ui/PageTransition'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useCartStore } from '../store/cartStore'
import { useCreateOrder } from '../hooks/useOrders'
import styles from './CheckoutPage.module.css'

/**
 * Checkout page (protected) with address form and order summary.
 */
export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const getShipping = useCartStore((s) => s.getShipping)

  const subtotal = getSubtotal()
  const shipping = getShipping()
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US',
  })
  const [errors, setErrors] = useState({})

  const createOrderMutation = useCreateOrder({
    onSuccess: (data) => navigate(`/orders`),
  })

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'First name is required'
    if (!form.lastName.trim()) errs.lastName = 'Last name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.postalCode.trim()) errs.postalCode = 'Postal code is required'
    return errs
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const orderPayload = {
      items: items.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
        size: i.size,
        price: i.price,
      })),
      address: {
        firstName: form.firstName,
        lastName: form.lastName,
        street: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
      },
      contact: { email: form.email, phone: form.phone },
      totals: { subtotal, shipping, tax, total },
    }

    createOrderMutation.mutate(orderPayload)
  }

  return (
    <PageTransition>
      <div className="container">
        <h1 className={styles.pageTitle}>Checkout</h1>

        <form onSubmit={handleSubmit} className={styles.layout} noValidate>
          {/* ---- Address form ---- */}
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Shipping Address</h2>

            <div className={styles.row2}>
              <Input
                id="checkout-first-name"
                label="First Name"
                name="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={handleChange}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <Input
                id="checkout-last-name"
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                error={errors.lastName}
                autoComplete="family-name"
              />
            </div>

            <Input
              id="checkout-email"
              label="Email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              id="checkout-phone"
              label="Phone (optional)"
              name="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            <Input
              id="checkout-address"
              label="Street Address"
              name="address"
              placeholder="123 Main St, Apt 4"
              value={form.address}
              onChange={handleChange}
              error={errors.address}
              autoComplete="street-address"
            />

            <div className={styles.row3}>
              <Input
                id="checkout-city"
                label="City"
                name="city"
                placeholder="New York"
                value={form.city}
                onChange={handleChange}
                error={errors.city}
                autoComplete="address-level2"
              />
              <Input
                id="checkout-postal"
                label="Postal Code"
                name="postalCode"
                placeholder="10001"
                value={form.postalCode}
                onChange={handleChange}
                error={errors.postalCode}
                autoComplete="postal-code"
              />
              <div className={styles.inputWrapper}>
                <label htmlFor="checkout-country" className={styles.selectLabel}>Country</label>
                <select
                  id="checkout-country"
                  name="country"
                  className={styles.selectInput}
                  value={form.country}
                  onChange={handleChange}
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={createOrderMutation.isPending}
              id="checkout-submit-btn"
            >
              Place Order · ${total.toFixed(2)}
            </Button>
          </div>

          {/* ---- Order summary ---- */}
          <div className={styles.summary}>
            <h2 className={styles.sectionTitle}>Order Summary</h2>

            <div className={styles.orderItems}>
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} className={styles.orderItem}>
                  <div className={styles.orderItemInfo}>
                    <img
                      src={item.image || `https://picsum.photos/seed/${item.id}/80/80`}
                      alt={item.name}
                      className={styles.orderItemImg}
                    />
                    <div>
                      <p className={styles.orderItemName}>{item.name}</p>
                      {item.size && <p className={styles.orderItemSize}>Size: {item.size}</p>}
                      <p className={styles.orderItemQty}>×{item.quantity}</p>
                    </div>
                  </div>
                  <span className={styles.orderItemPrice}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
