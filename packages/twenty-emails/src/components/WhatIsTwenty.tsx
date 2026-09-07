import { type I18n } from '@lingui/core';
import { MainText } from 'src/components/MainText';
import { SubTitle } from 'src/components/SubTitle';
import { getEmailBrandName } from '../utils/brand';

type WhatIsTwentyProps = {
  i18n: I18n;
};

export const WhatIsTwenty = ({ i18n }: WhatIsTwentyProps) => {
  return (
    <>
      <SubTitle value={i18n._('What is {brandName}?', { brandName: getEmailBrandName() })} />
      <MainText>
        {i18n._(
          "It's a CRM, a software to help businesses manage their customer data and relationships efficiently.",
        )}
      </MainText>
    </>
  );
};
