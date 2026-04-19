import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { PageHeader } from '@/components/page-header';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const rentalItems = [
  { title: 'Honda Winner X', price: 25, image: 'assets/images/resources/popular-tours-two__img-1.jpg', rating: '8.0 Superb', category: 'Motorbike' },
  { title: 'Honda XR 150', price: 30, image: 'assets/images/resources/popular-tours-two__img-2.jpg', rating: '8.5 Superb', category: 'Motorbike' },
  { title: 'Yamaha Exciter', price: 20, image: 'assets/images/resources/popular-tours-two__img-3.jpg', rating: '8.0 Superb', category: 'Motorbike' },
  { title: 'Honda CB500X', price: 55, image: 'assets/images/resources/popular-tours-two__img-4.jpg', rating: '9.0 Superb', category: 'Motorbike' },
  { title: 'Toyota Vios', price: 45, image: 'assets/images/resources/popular-tours-two__img-5.jpg', rating: '8.0 Superb', category: 'Car' },
  { title: 'Ford Ranger', price: 65, image: 'assets/images/resources/popular-tours-two__img-6.jpg', rating: '8.2 Superb', category: 'Car' },
];

export default function Rental() {
  const t = useTranslations('rental');
  const tMeta = useTranslations('meta');

  return (
    <>
      <Head>
        <title>{tMeta('rentalTitle')}</title>
        <meta name="description" content={tMeta('rentalDescription')} />
      </Head>

      <PageHeader
        title={t('title')}
        breadcrumbs={[
          { label: t('breadcrumbHome'), href: '/' },
          { label: t('breadcrumbRental') },
        ]}
        backgroundImage="https://vietnammotorcycletours.com/storage/2022/04/AR500963-1920x1280.jpg"
      />

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {rentalItems.map((item, i) => (
              <motion.div
                key={i}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ ...fadeInUp, visible: { ...fadeInUp.visible, transition: { duration: 0.6, delay: i * 0.1 } } }}
              >
                <div className="relative overflow-hidden aspect-[3/2]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                  <span className="absolute top-3 left-3 bg-secondary text-white text-xs font-bold uppercase px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                  <button
                    className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-white transition-all"
                    aria-label="Add to favorites"
                  >
                    <i className="fa fa-heart text-sm" />
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 text-sm text-primary font-semibold mb-2">
                    <i className="fa fa-star text-xs" /> {item.rating}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    <span className="text-primary font-bold text-lg">${item.price}</span> {t('perDay')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
  };
}
