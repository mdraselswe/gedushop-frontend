import Image from "next/image";
import Link from "next/link";
import SearchBar from "./SearchBar";
import HeaderNav from "./HeaderNav";
import HeaderCartButton from "./HeaderCartButton";
import HeaderWishlistButton from "./HeaderWishlistButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-plum-100/60 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[120rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:py-3">
        <Link href="/" className="shrink-0" aria-label="GeduShop home">
          <Image src="/logo-light.png" alt="GeduShop" width={66} height={48} className="h-10 w-auto md:h-11" preload />
        </Link>

        <HeaderNav />

        <div className="order-3 w-full md:order-none md:ml-2 md:w-80 lg:w-96">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <HeaderWishlistButton />
          <HeaderCartButton />
        </div>
      </div>
    </header>
  );
}
