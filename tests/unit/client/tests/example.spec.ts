import { mount } from '@vue/test-utils';
import { expect } from "chai";
import HomePage from '../../../../src/client/components/HomePage.vue';

describe('HomePage.vue', () => {
    it('renders home vue', () => {
        const wrapper = mount(HomePage);
        expect(wrapper.text()).to.include('Hello World');
    });
});
