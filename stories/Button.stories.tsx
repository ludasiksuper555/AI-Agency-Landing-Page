import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface ButtonProps {
  primary?: boolean;
  size?: 'small' | 'medium' | 'large';
  label: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ primary = false, size = 'medium', label, ...props }) => {
  const mode = primary ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900';
  const sizeClass = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  }[size];

  return (
    <button
      type="button"
      className={`rounded font-medium ${mode} ${sizeClass}`}
      {...props}
    >
      {label}
    </button>
  );
};

const meta: Meta<typeof Button> = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Button',
  },
};
