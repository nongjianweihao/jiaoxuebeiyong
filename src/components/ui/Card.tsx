import type { HTMLAttributes } from 'react';
import clsx from 'classnames';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('ui-card', className)} {...rest} />;
}

export default Card;
