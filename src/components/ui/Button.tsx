import type { ButtonHTMLAttributes } from 'react';
import clsx from 'classnames';

export type ButtonIntent = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intent?: ButtonIntent;
};

const intentStyles: Record<ButtonIntent, string> = {
  primary: 'ui-button-primary',
  accent: 'ui-button-accent',
  success: 'ui-button-success',
  warning: 'ui-button-warning',
  danger: 'ui-button-danger',
  ghost: 'ui-button-ghost',
};

export function Button({ intent = 'primary', className, ...rest }: ButtonProps) {
  return <button className={clsx('ui-button', intentStyles[intent], className)} {...rest} />;
}

export default Button;
