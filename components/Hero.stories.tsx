import type { ComponentMeta, ComponentStory } from '@storybook/react';

import Hero from './Hero';

export default {
  title: 'Components/Hero',
  component: Hero,
  parameters: {
    layout: 'fullscreen',
  },
} as ComponentMeta<typeof Hero>;

const Template: ComponentStory<typeof Hero> = () => <Hero />;

export const Default = Template.bind({});

export const WithoutBackground = Template.bind({});
WithoutBackground.args = {
  title: 'AI Agency',
  subtitle: 'Інноваційні рішення для вашого бізнесу',
  ctaText: 'Дізнатися більше',
  ctaLink: '#services',
};

export const WithCustomContent = Template.bind({});
WithCustomContent.args = {
  title: 'Штучний інтелект для бізнесу',
  subtitle: 'Підвищіть ефективність вашої компанії за допомогою наших AI рішень',
  ctaText: 'Замовити консультацію',
  ctaLink: '/contact',
  backgroundImage: '/images/custom-bg.jpg',
};
