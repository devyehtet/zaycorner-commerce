import Link from "next/link";

export function StoreHeader({active}:{active?:"shop"|"about"|"contact"}){
  return <>
    <div className="topbar"><span>Myanmar + Thailand delivery</span><span>•</span><span>Easy 7-day returns</span></div>
    <header className="site-header inner-header">
      <Link className="brand" href="/"><span>ZAY</span><b>CORNER</b></Link>
      <nav className="nav-links inner-nav">
        <Link className={active==="shop"?"current":""} href="/shop">Shop</Link>
        <Link className={active==="about"?"current":""} href="/about">About</Link>
        <Link className={active==="contact"?"current":""} href="/contact">Contact</Link>
        <Link href="/admin">Orders</Link>
      </nav>
      <Link className="bag-button page-home-button" href="/">Home <span>↗</span></Link>
    </header>
  </>
}

export function StoreFooter(){
  return <footer>
    <Link className="brand footer-brand" href="/"><span>ZAY</span><b>CORNER</b></Link>
    <p>Everyday finds with a little extra feeling.</p>
    <div className="footer-links"><Link href="/shop">Shop</Link><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/admin">Orders</Link></div>
    <div className="footer-bottom"><span>© 2026 Zay Corner</span><span>Myanmar + Thailand</span></div>
  </footer>
}
